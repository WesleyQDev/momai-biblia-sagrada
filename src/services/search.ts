import { bibleData } from './bible-data'
import { harpaData } from './harpa-data'
import type {
  BibleVerse,
  SearchResult,
  ParsedReference,
  Testament,
  SearchOptions,
  SearchScope,
  SearchMatchType
} from '../types/bible'

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Flat cache of all 31,104 verses with normalized search text
interface IndexedVerse {
  verse: BibleVerse
  normText: string
  words: Set<string>
}

let verseIndexCache: IndexedVerse[] | null = null
let indexedDatasetVersion = -1

function getVerseIndex(): IndexedVerse[] {
  const currentVersion = bibleData.getDatasetVersion()
  if (verseIndexCache && indexedDatasetVersion === currentVersion) return verseIndexCache

  const allBooks = bibleData.getAllBooks()
  const indexed: IndexedVerse[] = []

  for (const bookInfo of allBooks) {
    const rawBook = bibleData.getBookById(bookInfo.id)
    if (!rawBook) continue

    for (let cIdx = 0; cIdx < rawBook.chapters.length; cIdx++) {
      const chapterNum = cIdx + 1
      const verses = rawBook.chapters[cIdx]

      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        const verseNum = vIdx + 1
        const text = verses[vIdx]
        const normText = normalizeText(text)
        const words = new Set(normText.split(' ').filter(Boolean))

        indexed.push({
          verse: {
            id: `${rawBook.abbrev}-${chapterNum}-${verseNum}`,
            bookId: rawBook.id,
            bookName: rawBook.name,
            bookAbbrev: rawBook.abbrev,
            testament: rawBook.testament,
            chapter: chapterNum,
            verse: verseNum,
            text
          },
          normText,
          words
        })
      }
    }
  }

  verseIndexCache = indexed
  indexedDatasetVersion = currentVersion
  return verseIndexCache
}

export const bibleSearch = {
  parseReference(query: string): ParsedReference | null {
    const clean = query.trim()
    if (!clean) return null

    // Regex 1: "João 3:16", "1 Jo 3:16", "Sl 23:1", "1 Co 13:4-7", "Jo 3 16"
    const refMatch = clean.match(/^([1-3]?\s*[a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(\d+)[:\s]+(\d+)(?:-(\d+))?$/i)
    if (refMatch) {
      const bookQuery = refMatch[1].trim()
      const book = bibleData.findBook(bookQuery)
      if (book) {
        return {
          bookQuery,
          book: {
            id: book.id,
            name: book.name,
            abbrev: book.abbrev,
            testament: book.testament,
            totalChapters: book.totalChapters
          },
          chapter: parseInt(refMatch[2], 10),
          verse: parseInt(refMatch[3], 10),
          endVerse: refMatch[4] ? parseInt(refMatch[4], 10) : undefined
        }
      }
    }

    // Regex 2: "Salmos 23", "Jo 3", "Gênesis 1"
    const chapMatch = clean.match(/^([1-3]?\s*[a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(\d+)$/i)
    if (chapMatch) {
      const bookQuery = chapMatch[1].trim()
      const book = bibleData.findBook(bookQuery)
      if (book) {
        return {
          bookQuery,
          book: {
            id: book.id,
            name: book.name,
            abbrev: book.abbrev,
            testament: book.testament,
            totalChapters: book.totalChapters
          },
          chapter: parseInt(chapMatch[2], 10)
        }
      }
    }

    // Regex 3: Just book name e.g. "Gênesis", "Romanos", "Salmos"
    const bookOnly = bibleData.findBook(clean)
    if (bookOnly) {
      return {
        bookQuery: clean,
        book: {
          id: bookOnly.id,
          name: bookOnly.name,
          abbrev: bookOnly.abbrev,
          testament: bookOnly.testament,
          totalChapters: bookOnly.totalChapters
        }
      }
    }

    return null
  },

  search(
    query: string,
    options: SearchOptions = {}
  ): SearchResult[] {
    const rawQuery = query.trim()
    if (!rawQuery) return []

    const limit = options.limit || 20
    let scope: SearchScope = options.scope || 'ALL'
    if (options.testament) {
      if (options.testament === 'AT') scope = 'AT'
      else if (options.testament === 'NT') scope = 'NT'
      else if (options.testament === 'HARPA') scope = 'HARPA'
      else if (options.testament === 'ALL') scope = 'ALL'
    }
    const verseResults: SearchResult[] = []
    const hymnResults: SearchResult[] = []

    // 1. Try parsing as exact biblical reference first (when scope includes Bible)
    if (scope !== 'HARPA') {
      const ref = this.parseReference(rawQuery)
      if (ref && ref.book) {
        const bookTestament = ref.book.testament
        const matchesScope = scope === 'ALL' || bookTestament === scope
        if (matchesScope) {
          if (ref.chapter && ref.verse) {
            const verse = bibleData.getVerse(ref.book.id, ref.chapter, ref.verse)
            if (verse) {
              verseResults.push({
                type: 'verse',
                verse,
                score: 1000,
                matchType: 'exact_reference',
                snippet: verse.text
              })
            }
            if (ref.endVerse && ref.endVerse > ref.verse) {
              for (let v = ref.verse + 1; v <= ref.endVerse; v++) {
                const rangeVerse = bibleData.getVerse(ref.book.id, ref.chapter, v)
                if (rangeVerse) {
                  verseResults.push({
                    type: 'verse',
                    verse: rangeVerse,
                    score: 950 - v,
                    matchType: 'exact_reference',
                    snippet: rangeVerse.text
                  })
                }
              }
            }
          } else if (ref.chapter) {
            const chapterVerses = bibleData.getChapterVerses(ref.book.id, ref.chapter)
            for (const cv of chapterVerses.slice(0, Math.min(limit, 10))) {
              verseResults.push({
                type: 'verse',
                verse: cv,
                score: 800 - cv.verse,
                matchType: 'exact_reference',
                snippet: cv.text
              })
            }
          } else {
            const bookVerses = bibleData.getChapterVerses(ref.book.id, 1)
            for (const bv of bookVerses.slice(0, Math.min(limit, 5))) {
              verseResults.push({
                type: 'verse',
                verse: bv,
                score: 700 - bv.verse,
                matchType: 'exact_reference',
                snippet: bv.text
              })
            }
          }

          if (verseResults.length > 0 && scope !== 'ALL') {
            return verseResults.slice(0, limit)
          }
        }
      }
    }

    // 2. Full text smart search for Bible verses
    const normQuery = normalizeText(rawQuery)
    const paddedQuery = ` ${normQuery} `
    const queryTokens = normQuery.split(' ').filter((t) => t.length > 0)
    if (queryTokens.length === 0) return []

    if (scope !== 'HARPA') {
      const index = getVerseIndex()

      for (const item of index) {
        if (scope !== 'ALL' && item.verse.testament !== scope) {
          continue
        }

        const paddedNormText = ` ${item.normText} `
        const hasExactWordOrPhrase = paddedNormText.includes(paddedQuery)

        // 1. Exact whole word or exact phrase match
        if (hasExactWordOrPhrase) {
          verseResults.push({
            type: 'verse',
            verse: item.verse,
            score: 550 + (100 / (item.normText.length + 1)),
            matchType: 'exact_phrase',
            snippet: item.verse.text
          })
          continue
        }

        // 2. Check if all words are present as whole words
        let exactWordsCount = 0
        let partialWordsCount = 0

        for (const token of queryTokens) {
          if (item.words.has(token)) {
            exactWordsCount++
          } else {
            for (const w of item.words) {
              if (w.includes(token)) {
                partialWordsCount++
                break
              }
            }
          }
        }

        if (exactWordsCount === queryTokens.length) {
          verseResults.push({
            type: 'verse',
            verse: item.verse,
            score: 400 + exactWordsCount * 10,
            matchType: 'all_words',
            snippet: item.verse.text
          })
          continue
        }

        if (exactWordsCount + partialWordsCount >= queryTokens.length) {
          verseResults.push({
            type: 'verse',
            verse: item.verse,
            score: 250 + exactWordsCount * 10 + partialWordsCount * 5,
            matchType: 'all_words',
            snippet: item.verse.text
          })
          continue
        }

        // 3. Substring inside another word (e.g. "cabo" inside "acabou" or "cabom")
        if (item.normText.includes(normQuery)) {
          verseResults.push({
            type: 'verse',
            verse: item.verse,
            score: 80 + (50 / (item.normText.length + 1)),
            matchType: 'partial',
            snippet: item.verse.text
          })
        }
      }
    }

    // 3. Harpa Cristã search (when scope is ALL or HARPA)
    if (scope === 'ALL' || scope === 'HARPA') {
      const harpaResults = harpaData.search(rawQuery, { limit: Math.max(limit, 30) })

      for (const hRes of harpaResults) {
        let score = 250
        let snippet = ''

        const normTitle = normalizeText(hRes.hymn.title)
        const paddedTitle = ` ${normTitle} `

        if (hRes.matchType === 'number') {
          score = 1000
          snippet = hRes.hymn.stanzas[0]?.[0] || (hRes.hymn.chorus?.[0] ? `Coro: ${hRes.hymn.chorus[0]}` : hRes.hymn.title)
        } else if (hRes.matchType === 'title') {
          if (normTitle === normQuery) {
            score = 950
          } else if (paddedTitle.includes(paddedQuery)) {
            score = 850
          } else {
            score = 700
          }
          snippet = hRes.hymn.stanzas[0]?.[0] || (hRes.hymn.chorus?.[0] ? `Coro: ${hRes.hymn.chorus[0]}` : hRes.hymn.title)
        } else if (hRes.matchType === 'chorus') {
          const matchedLine = hRes.hymn.chorus?.find((line) => {
            const nl = normalizeText(line)
            return nl.includes(normQuery) || queryTokens.some((tok) => nl.includes(tok))
          })
          const isExactWord = matchedLine ? ` ${normalizeText(matchedLine)} `.includes(paddedQuery) : false
          score = isExactWord ? 700 : 500
          snippet = matchedLine ? `Coro: "${matchedLine.trim()}"` : `Coro: "${(hRes.hymn.chorus?.[0] || '').trim()}"`
        } else {
          // lyric
          const allLines = hRes.hymn.stanzas.flat()
          const matchedLine = allLines.find((line) => {
            const nl = normalizeText(line)
            return nl.includes(normQuery) || queryTokens.some((tok) => nl.includes(tok))
          })
          const isExactWord = matchedLine ? ` ${normalizeText(matchedLine)} `.includes(paddedQuery) : false
          score = isExactWord ? 600 : 400
          snippet = matchedLine ? `"${matchedLine.trim()}"` : `"${(allLines[0] || '').trim()}"`
        }

        hymnResults.push({
          type: 'hymn',
          hymn: hRes.hymn,
          score,
          matchType: `hymn_${hRes.matchType}` as SearchMatchType,
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
