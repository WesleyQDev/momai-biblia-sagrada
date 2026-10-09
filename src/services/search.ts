import { bibleData } from './bible-data'
import { harpaData } from './harpa-data'
import {
  buildVerseIndex,
  clampSearchLimit,
  parseVerseReference,
  searchReference,
  searchVerseIndex,
  type IndexedVerse
} from './bible-search-core'
import type {
  BibleVerse,
  SearchResult,
  ParsedReference,
  SearchOptions,
  SearchScope
} from '../types/bible'

// Flat cache of the active translation's verses with normalized search text.
// Rebuilt only when the reader switches translation.
let verseIndexCache: IndexedVerse[] | null = null
let indexedDatasetVersion = -1

function getVerseIndex(): IndexedVerse[] {
  const currentVersion = bibleData.getDatasetVersion()
  if (verseIndexCache && indexedDatasetVersion === currentVersion) return verseIndexCache

  verseIndexCache = buildVerseIndex(bibleData.getActiveBooks())
  indexedDatasetVersion = currentVersion
  return verseIndexCache
}

function toSearchResult(hit: { verse: BibleVerse; score: number; matchType: SearchResult['matchType']; snippet: string }): SearchResult {
  return {
    type: 'verse',
    verse: hit.verse,
    score: hit.score,
    matchType: hit.matchType,
    snippet: hit.snippet
  }
}

export const bibleSearch = {
  parseReference(query: string): ParsedReference | null {
    return parseVerseReference(query, bibleData.getLookup())
  },

  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const rawQuery = query.trim()
    if (!rawQuery) return []

    const limit = clampSearchLimit(options.limit ?? 20)
    let scope: SearchScope = options.scope || 'ALL'
    if (options.testament) {
      if (options.testament === 'AT') scope = 'AT'
      else if (options.testament === 'NT') scope = 'NT'
      else if (options.testament === 'HARPA') scope = 'HARPA'
      else if (options.testament === 'ALL') scope = 'ALL'
    }
    let verseResults: SearchResult[] = []
    const hymnResults: SearchResult[] = []

    // 1. Exact biblical reference first (when the scope includes the Bible)
    if (scope !== 'HARPA') {
      const ref = this.parseReference(rawQuery)
      if (ref && ref.book) {
        const matchesScope = scope === 'ALL' || ref.book.testament === scope
        if (matchesScope) {
          verseResults = searchReference(bibleData.getActiveBooks(), ref, limit).map(toSearchResult)
          if (verseResults.length > 0 && scope !== 'ALL') {
            return verseResults.slice(0, limit)
          }
        }
      }
    }

    // 2. Full-text search over the active translation
    if (scope !== 'HARPA') {
      const testament = scope === 'AT' || scope === 'NT' ? scope : 'ALL'
      const textHits = searchVerseIndex(getVerseIndex(), rawQuery, { testament, limit })
      verseResults = [...verseResults, ...textHits.map(toSearchResult)]
    }

    // 3. Harpa Cristã search (when scope is ALL or HARPA)
    if (scope === 'ALL' || scope === 'HARPA') {
      const harpaResults = harpaData.search(rawQuery, { limit: Math.max(limit, 30) })

      for (const hRes of harpaResults) {
        let score = 250
        let snippet = ''

        const normTitle = hRes.hymn.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        const normRhyme = rawQuery
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        const paddedTitle = ` ${normTitle} `
        const paddedQuery = ` ${normRhyme} `
        const queryTokens = normRhyme.split(' ').filter(Boolean)

        if (hRes.matchType === 'number') {
          score = 1000
          snippet = hRes.hymn.stanzas[0]?.[0] || (hRes.hymn.chorus?.[0] ? `Coro: ${hRes.hymn.chorus[0]}` : hRes.hymn.title)
        } else if (hRes.matchType === 'title') {
          if (normTitle === normRhyme) {
            score = 950
          } else if (paddedTitle.includes(paddedQuery)) {
            score = 850
          } else {
            score = 700
          }
          snippet = hRes.hymn.stanzas[0]?.[0] || (hRes.hymn.chorus?.[0] ? `Coro: ${hRes.hymn.chorus[0]}` : hRes.hymn.title)
        } else if (hRes.matchType === 'chorus') {
          const matchedLine = hRes.hymn.chorus?.find((line) => {
            const nl = normalizeHymnText(line)
            return nl.includes(normRhyme) || queryTokens.some((tok) => nl.includes(tok))
          })
          const isExactWord = matchedLine ? ` ${normalizeHymnText(matchedLine)} `.includes(paddedQuery) : false
          score = isExactWord ? 700 : 500
          snippet = matchedLine ? `Coro: "${matchedLine.trim()}"` : `Coro: "${(hRes.hymn.chorus?.[0] || '').trim()}"`
        } else {
          const allLines = hRes.hymn.stanzas.flat()
          const matchedLine = allLines.find((line) => {
            const nl = normalizeHymnText(line)
            return nl.includes(normRhyme) || queryTokens.some((tok) => nl.includes(tok))
          })
          const isExactWord = matchedLine ? ` ${normalizeHymnText(matchedLine)} `.includes(paddedQuery) : false
          score = isExactWord ? 600 : 400
          snippet = matchedLine ? `"${matchedLine.trim()}"` : `"${(allLines[0] || '').trim()}"`
        }

        hymnResults.push({
          type: 'hymn',
          hymn: hRes.hymn,
          score,
          matchType: `hymn_${hRes.matchType}` as SearchResult['matchType'],
          snippet
        })
      }
    }

    if (scope === 'HARPA') {
      hymnResults.sort((a, b) => b.score - a.score)
      return hymnResults.slice(0, limit)
    }

    if (scope === 'AT' || scope === 'NT') {
      verseResults.sort((a, b) => b.score - a.score)
      return verseResults.slice(0, limit)
    }

    // scope === 'ALL': verses appear first, followed by hymns
    verseResults.sort((a, b) => b.score - a.score)
    hymnResults.sort((a, b) => b.score - a.score)

    if (hymnResults.length === 0) return verseResults.slice(0, limit)
    if (verseResults.length === 0) return hymnResults.slice(0, limit)

    // Balance results so verses appear first and relevant hymns appear after
    const desiredHymns = Math.min(hymnResults.length, Math.max(3, Math.floor(limit * 0.35)))
    const verseSlots = Math.min(verseResults.length, limit - desiredHymns)
    const hymnSlots = Math.min(hymnResults.length, limit - verseSlots)

    const topVerses = verseResults.slice(0, verseSlots)
    const topHymns = hymnResults.slice(0, hymnSlots)

    return [...topVerses, ...topHymns]
  }
}

function normalizeHymnText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
