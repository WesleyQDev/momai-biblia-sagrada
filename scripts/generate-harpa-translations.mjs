#!/usr/bin/env node
/**
 * Fills the Harpa Cristã translation overlays (title, stanzas, chorus) for
 * every supported language, skipping hymns that already have a valid entry.
 *
 * The Portuguese dataset is the source of truth. Each batch is serialized
 * with structural markers ([Hn], ---, [Cn]) that survive machine translation,
 * then parsed back and validated against the original structure. Hymns whose
 * translation does not mirror the original (stanza/chorus line counts) are
 * discarded, so the runtime keeps the Portuguese fallback for them.
 *
 * Usage:
 *   node scripts/generate-harpa-translations.mjs               # all languages
 *   node scripts/generate-harpa-translations.mjs --lang=en-US  # one language
 *   node scripts/generate-harpa-translations.mjs --dry-run     # report only
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HARPA_DIR = path.join(__dirname, '..', 'assets', 'harpa')

const LANGUAGE_CODES = {
  'en-US': 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it'
}

const MAX_BATCH_CHARS = 2600
const MAX_BATCH_HYMNS = 4
const REQUEST_DELAY_MS = 400
const RETRY_DELAYS_MS = [3000, 10000, 30000]
const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  const payload = `${JSON.stringify(data, null, 2)}\n`
  const tmpPath = `${filePath}.tmp`
  // Windows can briefly hold the target (indexer/AV/editor), so retry the
  // rename and fall back to a direct overwrite when rename keeps failing.
  let lastError = null
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      fs.writeFileSync(tmpPath, payload, 'utf8')
      fs.renameSync(tmpPath, filePath)
      return
    } catch (err) {
      lastError = err
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200 * (attempt + 1))
    }
  }
  try {
    fs.writeFileSync(filePath, payload, 'utf8')
    fs.rmSync(tmpPath, { force: true })
  } catch {
    throw lastError
  }
}

function serializeHymn(hymn) {
  const lines = [`[H${hymn.number}]`, hymn.title]
  for (const stanza of hymn.stanzas) {
    lines.push('---')
    lines.push(...stanza)
  }
  if (hymn.chorus && hymn.chorus.length > 0) {
    lines.push(`[C${hymn.number}]`)
    lines.push(...hymn.chorus)
  }
  return lines
}

function serializeBatch(hymns) {
  return hymns.flatMap(serializeHymn).join('\n')
}

function parseBatch(text, expectedNumbers) {
  const lines = text.split(/\r?\n/).map((line) => line.trim())
  const hymns = []
  let current = null
  let target = null

  const closeCurrent = () => {
    if (current) hymns.push(current)
    current = null
    target = null
  }

  for (const line of lines) {
    const head = line.match(/^\[H(\d+)\]$/)
    if (head) {
      closeCurrent()
      current = { number: Number(head[1]), title: '', stanzas: [], chorus: undefined, _chorus: false }
      target = 'title'
      continue
    }
    const chorus = line.match(/^\[C(\d+)\]$/)
    if (chorus) {
      if (!current || current.number !== Number(chorus[1])) return null
      current.chorus = []
      current._chorus = true
      target = 'chorus'
      continue
    }
    if (!current) return null
    if (line === '---') {
      if (target === 'title') return null
      if (current._chorus) return null
      current.stanzas.push([])
      target = 'stanza'
      continue
    }
    if (target === 'title') {
      if (current.title) return null
      current.title = line
      target = 'body'
      continue
    }
    if (target === 'chorus') {
      current.chorus.push(line)
      continue
    }
    if (target === 'stanza' || target === 'body') {
      if (current.stanzas.length === 0) return null
      current.stanzas[current.stanzas.length - 1].push(line)
      continue
    }
    return null
  }
  closeCurrent()

  const numbers = hymns.map((hymn) => hymn.number)
  if (numbers.length !== expectedNumbers.length) return null
  if (numbers.some((number, index) => number !== expectedNumbers[index])) return null
  for (const hymn of hymns) delete hymn._chorus
  return hymns
}

function validateTranslation(original, translated) {
  if (!translated) return false
  if (!translated.title || !translated.title.trim()) return false
  if (translated.stanzas.length !== original.stanzas.length) return false

  const nonEmpty = (value) => typeof value === 'string' && value.trim() !== ''
  for (let i = 0; i < original.stanzas.length; i++) {
    const expected = original.stanzas[i]
    const got = translated.stanzas[i]
    if (!Array.isArray(got) || got.length !== expected.length) return false
    if (got.some((line) => !nonEmpty(line))) return false
  }

  const originalHasChorus = Array.isArray(original.chorus) && original.chorus.length > 0
  if (originalHasChorus) {
    if (!Array.isArray(translated.chorus)) return false
    if (translated.chorus.length !== original.chorus.length) return false
    if (translated.chorus.some((line) => !nonEmpty(line))) return false
  } else if (translated.chorus && translated.chorus.length > 0) {
    return false
  }

  const originalText = JSON.stringify({
    title: original.title,
    stanzas: original.stanzas,
    chorus: original.chorus ?? null
  })
  const translatedText = JSON.stringify({
    title: translated.title,
    stanzas: translated.stanzas,
    chorus: translated.chorus ?? null
  })
  return originalText !== translatedText
}

async function translateChunk(text, targetCode) {
  const url = new URL(TRANSLATE_URL)
  url.searchParams.set('client', 'dict-chrome-ex')
  url.searchParams.set('sl', 'pt')
  url.searchParams.set('tl', targetCode)
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)

  let lastError = null
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(30000)
      })
      if (response.ok) {
        const data = await response.json()
        const segments = Array.isArray(data[0]) ? data[0] : []
        const translated = segments.map((segment) => (Array.isArray(segment) ? segment[0] : '')).join('')
        if (translated.trim()) return translated
        lastError = new Error('empty translation')
      } else {
        lastError = new Error(`HTTP ${response.status}`)
        if (response.status !== 429 && response.status < 500) break
      }
    } catch (err) {
      lastError = err
    }
    if (attempt < RETRY_DELAYS_MS.length) await sleep(RETRY_DELAYS_MS[attempt])
  }
  throw lastError ?? new Error('translation failed')
}

function buildBatches(hymns) {
  const batches = []
  let current = []
  let chars = 0
  for (const hymn of hymns) {
    const hymnChars = serializeHymn(hymn).join('\n').length + 1
    if (
      current.length > 0 &&
      (current.length >= MAX_BATCH_HYMNS || chars + hymnChars > MAX_BATCH_CHARS)
    ) {
      batches.push(current)
      current = []
      chars = 0
    }
    current.push(hymn)
    chars += hymnChars
  }
  if (current.length > 0) batches.push(current)
  return batches
}

function isValidExisting(entry, original) {
  if (!entry) return false
  if (entry.number !== original.number) return false
  if (!Array.isArray(entry.stanzas)) return false
  if (entry.stanzas.length !== original.stanzas.length) return false
  if (!entry.title || !entry.title.trim()) return false
  if (JSON.stringify(entry.stanzas) === JSON.stringify(original.stanzas)) return false
  return true
}

async function generateLanguage(baseHymns, languageId, { dryRun }) {
  const targetCode = LANGUAGE_CODES[languageId]
  const overlayPath = path.join(HARPA_DIR, `harpa-${languageId}.json`)
  const overlay = readJson(overlayPath)
  const existing = new Map((overlay.hymns ?? []).map((hymn) => [hymn.number, hymn]))

  const missing = baseHymns.filter((hymn) => !isValidExisting(existing.get(hymn.number), hymn))
  console.log(
    `[${languageId}] ${existing.size} existing, ${missing.length} to translate (${baseHymns.length} total)`
  )
  if (missing.length === 0) return { translated: 0, skipped: 0 }
  if (dryRun) return { translated: 0, skipped: missing.length }

  const batches = buildBatches(missing)
  let translated = 0
  let skipped = 0

  for (const batch of batches) {
    const numbers = batch.map((hymn) => hymn.number)
    let parsed = null
    try {
      const output = await translateChunk(serializeBatch(batch), targetCode)
      parsed = parseBatch(output, numbers)
    } catch (err) {
      console.warn(`[${languageId}] batch ${numbers[0]}..${numbers[numbers.length - 1]} failed: ${err.message}`)
      parsed = null
    }

    const valid = new Map()
    if (parsed) {
      for (const hymn of parsed) {
        const original = baseHymns.find((item) => item.number === hymn.number)
        if (validateTranslation(original, hymn)) valid.set(hymn.number, hymn)
      }
    }

    for (const original of batch) {
      let result = valid.get(original.number)
      if (!result) {
        await sleep(REQUEST_DELAY_MS)
        try {
          const output = await translateChunk(serializeHymn(original), targetCode)
          const single = parseBatch(output, [original.number])
          if (single && validateTranslation(original, single[0])) result = single[0]
        } catch (err) {
          console.warn(`[${languageId}] hymn ${original.number} retry failed: ${err.message}`)
        }
      }
      if (result) {
        existing.set(original.number, result)
        translated++
      } else {
        skipped++
        console.warn(`[${languageId}] hymn ${original.number} kept Portuguese (invalid translation)`)
      }
    }

    overlay.hymns = [...existing.values()].sort((a, b) => a.number - b.number)
    overlay.totalHymns = baseHymns.length
    writeJson(overlayPath, overlay)
    console.log(`[${languageId}] progress ${translated + skipped}/${missing.length}`)
    await sleep(REQUEST_DELAY_MS)
  }

  return { translated, skipped }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const langArg = args.find((arg) => arg.startsWith('--lang='))
  const requested = langArg ? langArg.slice('--lang='.length) : null

  if (requested && !(requested in LANGUAGE_CODES)) {
    console.error(`Unknown language: ${requested}. Use one of: ${Object.keys(LANGUAGE_CODES).join(', ')}`)
    process.exit(1)
  }

  const base = readJson(path.join(HARPA_DIR, 'harpa-crista.json'))
  const baseHymns = [...base.hymns].sort((a, b) => a.number - b.number)
  if (baseHymns.length !== base.totalHymns) {
    console.error(`Base dataset mismatch: ${baseHymns.length} hymns vs totalHymns ${base.totalHymns}`)
    process.exit(1)
  }

  const languages = requested ? [requested] : Object.keys(LANGUAGE_CODES)
  let totalTranslated = 0
  let totalSkipped = 0

  for (const languageId of languages) {
    const result = await generateLanguage(baseHymns, languageId, { dryRun })
    totalTranslated += result.translated
    totalSkipped += result.skipped
  }

  console.log(`Done. translated=${totalTranslated} skipped=${totalSkipped} dryRun=${dryRun}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
