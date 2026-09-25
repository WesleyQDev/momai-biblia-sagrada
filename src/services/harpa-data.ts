import baseDataset from '../../assets/harpa/harpa-crista.json'
import enUSOverlay from '../../assets/harpa/harpa-en-US.json'
import esOverlay from '../../assets/harpa/harpa-es.json'
import frOverlay from '../../assets/harpa/harpa-fr.json'
import deOverlay from '../../assets/harpa/harpa-de.json'
import itOverlay from '../../assets/harpa/harpa-it.json'
import type { HarpaDataset, HarpaHymn, HarpaSearchResult } from '../types/harpa'
import {
  DEFAULT_BIBLE_LANGUAGE_ID,
  isBibleLanguageId,
  type BibleLanguageId
} from './bible-languages'

const base = baseDataset as HarpaDataset
const baseHymns: HarpaHymn[] = [...base.hymns].sort((a, b) => a.number - b.number)
const baseByNumber = new Map<number, HarpaHymn>(baseHymns.map((hymn) => [hymn.number, hymn]))

type HarpaOverlay = Pick<HarpaDataset, 'hymns'>

const overlayCache = new Map<BibleLanguageId, Map<number, HarpaHymn>>([
  [DEFAULT_BIBLE_LANGUAGE_ID, new Map()],
  ['en-US', toOverlayMap(enUSOverlay as HarpaOverlay)],
  ['es', toOverlayMap(esOverlay as HarpaOverlay)],
  ['fr', toOverlayMap(frOverlay as HarpaOverlay)],
  ['de', toOverlayMap(deOverlay as HarpaOverlay)],
  ['it', toOverlayMap(itOverlay as HarpaOverlay)]
])

function toOverlayMap(overlay: HarpaOverlay): Map<number, HarpaHymn> {
  const map = new Map<number, HarpaHymn>()
  for (const hymn of overlay.hymns ?? []) {
    if (hymn && Number.isInteger(hymn.number)) map.set(hymn.number, hymn)
  }
  return map
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function hasLines(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.some((line) => hasText(line))
}

function hasStanzas(value: unknown): value is string[][] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.some((stanza) => Array.isArray(stanza) && stanza.some((line) => hasText(line)))
  )
}

// Per-field fallback: Portuguese stays the original. Any translated title,
// stanza set or chorus missing from the overlay falls back to Portuguese
// hymn by hymn, so partially translated languages never render blanks.
function mergeHymn(original: HarpaHymn, translated?: HarpaHymn): HarpaHymn {
  if (!translated) return original
  return {
    number: original.number,
    title: hasText(translated.title) ? translated.title : original.title,
    stanzas: hasStanzas(translated.stanzas) ? translated.stanzas : original.stanzas,
    chorus: hasLines(translated.chorus) ? translated.chorus : original.chorus
  }
}

let activeLanguageId: BibleLanguageId = DEFAULT_BIBLE_LANGUAGE_ID
let activeHymns: HarpaHymn[] = baseHymns
let hymnByNumber = new Map<number, HarpaHymn>(baseByNumber)
let datasetVersion = 0
const listeners = new Set<() => void>()

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

interface IndexedHymn {
  hymn: HarpaHymn
  title: string
  chorus: string
  lyrics: string
}

// Search index always mirrors the active language (translated text where it
// exists, Portuguese fallback elsewhere), so queries follow what is on screen.
let indexedHymns: IndexedHymn[] = buildIndex(activeHymns)

function buildIndex(hymns: HarpaHymn[]): IndexedHymn[] {
  return hymns.map((hymn) => ({
    hymn,
    title: normalize(hymn.title),
    chorus: normalize((hymn.chorus || []).join(' ')),
    lyrics: normalize(hymn.stanzas.flat().join(' '))
  }))
}

function setActiveDataset(id: BibleLanguageId): void {
  const overlay = overlayCache.get(id) ?? new Map<number, HarpaHymn>()
  activeHymns = baseHymns.map((original) => mergeHymn(original, overlay.get(original.number)))
  hymnByNumber = new Map<number, HarpaHymn>(activeHymns.map((hymn) => [hymn.number, hymn]))
  indexedHymns = buildIndex(activeHymns)
  activeLanguageId = id
  datasetVersion += 1
  emitChange()
}

function emitChange(): void {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch {
      // Ignore listener errors so one bad subscriber never breaks reading
    }
  })
}

const SEARCH_LIMIT_DEFAULT = 40

export const harpaData = {
  getActiveLanguageId(): BibleLanguageId {
    return activeLanguageId
  },

  getDatasetVersion(): number {
    return datasetVersion
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  loadHarpaLanguage(id: BibleLanguageId): Promise<void> {
    if (!isBibleLanguageId(id)) {
      return Promise.reject(new Error(`Unknown Harpa language: ${String(id)}`))
    }
    if (id === activeLanguageId) return Promise.resolve()
    if (!overlayCache.has(id)) {
      return Promise.reject(new Error(`Harpa translation for ${id} is not available`))
    }
    setActiveDataset(id)
    return Promise.resolve()
  },

  getSource(): string {
    return base.source
  },

  getTotalHymns(): number {
    return activeHymns.length
  },

  getAllHymns(): HarpaHymn[] {
    return activeHymns
  },

  getHymn(number: number): HarpaHymn | undefined {
    if (!Number.isInteger(number)) return undefined
    return hymnByNumber.get(number)
  },

  getOriginalHymn(number: number): HarpaHymn | undefined {
    if (!Number.isInteger(number)) return undefined
    return baseByNumber.get(number)
  },

  isHymnTranslated(number: number): boolean {
    const overlay = overlayCache.get(activeLanguageId)
    if (!overlay) return false
    const translated = overlay.get(number)
    if (!translated) return false
    const original = baseByNumber.get(number)
    if (!original) return false
    const merged = mergeHymn(original, translated)
    return (
      merged.title !== original.title ||
      merged.stanzas !== original.stanzas ||
      merged.chorus !== original.chorus
    )
  },

  getNextHymn(number: number): HarpaHymn | undefined {
    return hymnByNumber.get(number + 1)
  },

  getPrevHymn(number: number): HarpaHymn | undefined {
    return hymnByNumber.get(number - 1)
  },

  search(query: string, options: { limit?: number } = {}): HarpaSearchResult[] {
    const term = normalize(query)
    if (!term) return []

    const limit = options.limit ?? SEARCH_LIMIT_DEFAULT
    const results: HarpaSearchResult[] = []
    const seen = new Set<number>()

    const push = (hymn: HarpaHymn, matchType: HarpaSearchResult['matchType']) => {
      if (seen.has(hymn.number)) return
      seen.add(hymn.number)
      results.push({ hymn, matchType })
    }

    const strippedNumeric = query.trim().match(/^(?:hino|harpa)?\s*#?\s*(\d+)$/i)
    const numericQuery = strippedNumeric ? Number(strippedNumeric[1]) : null

    if (numericQuery !== null) {
      const exact = hymnByNumber.get(numericQuery)
      if (exact) push(exact, 'number')
      indexedHymns
        .filter((entry) => String(entry.hymn.number).startsWith(String(numericQuery)))
        .forEach((entry) => push(entry.hymn, 'number'))
    }

    indexedHymns
      .filter((entry) => entry.title.includes(term))
      .forEach((entry) => push(entry.hymn, 'title'))

    indexedHymns
      .filter((entry) => entry.chorus.includes(term))
      .forEach((entry) => push(entry.hymn, 'chorus'))

    indexedHymns
      .filter((entry) => entry.lyrics.includes(term))
      .forEach((entry) => push(entry.hymn, 'lyric'))

    return results.slice(0, limit)
  }
}
