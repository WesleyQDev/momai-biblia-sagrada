import { bibleData } from './bible-data'
import type { BibleVerse, SearchResult, ParsedReference, Testament } from '../types/bible'

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

function getVerseIndex(): IndexedVerse[] {
  if (verseIndexCache) return verseIndexCache

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
    options: {
      testament?: Testament | 'ALL'
      limit?: number
    } = {}
  ): SearchResult[] {
    const rawQuery = query.trim()
    if (!rawQuery) return []

    const limit = options.limit || 20
    const testament = options.testament || 'ALL'
    const results: SearchResult[] = []

    // 1. Try parsing as exact biblical reference first
    const ref = this.parseReference(rawQuery)
    if (ref && ref.book) {
      if (ref.chapter && ref.verse) {
        const verse = bibleData.getVerse(ref.book.id, ref.chapter, ref.verse)
        if (verse) {
          if (testament === 'ALL' || verse.testament === testament) {
            results.push({
              verse,
              score: 1000,
              matchType: 'exact_reference'
            })
          }
        }
        // If range specified, e.g. 16-18
        if (ref.endVerse && ref.endVerse > ref.verse) {
          for (let v = ref.verse + 1; v <= ref.endVerse; v++) {
            const rangeVerse = bibleData.getVerse(ref.book.id, ref.chapter, v)
            if (rangeVerse && (testament === 'ALL' || rangeVerse.testament === testament)) {
              results.push({
                verse: rangeVerse,
                score: 950 - v,
                matchType: 'exact_reference'
              })
            }
          }
        }
      } else if (ref.chapter) {
        // Return first verses of chapter
        const chapterVerses = bibleData.getChapterVerses(ref.book.id, ref.chapter)
        for (const cv of chapterVerses.slice(0, Math.min(limit, 10))) {
          if (testament === 'ALL' || cv.testament === testament) {
            results.push({
              verse: cv,
              score: 800 - cv.verse,
              matchType: 'exact_reference'
            })
          }
        }
      } else {
        // Return first verses of the book (chapter 1)
        const bookVerses = bibleData.getChapterVerses(ref.book.id, 1)
        for (const bv of bookVerses.slice(0, Math.min(limit, 5))) {
          if (testament === 'ALL' || bv.testament === testament) {
            results.push({
              verse: bv,
              score: 700 - bv.verse,
              matchType: 'exact_reference'
            })
          }
        }
      }

      if (results.length > 0) {
        return results.slice(0, limit)
      }
    }

    // 2. Full text smart search
    const normQuery = normalizeText(rawQuery)
    const queryTokens = normQuery.split(' ').filter((t) => t.length > 0)
    if (queryTokens.length === 0) return []

    const index = getVerseIndex()

    for (const item of index) {
      if (testament !== 'ALL' && item.verse.testament !== testament) {
        continue
      }

      // Check Exact phrase
      if (item.normText.includes(normQuery)) {
        results.push({
          verse: item.verse,
          score: 500 + (100 / (item.normText.length + 1)),
          matchType: 'exact_phrase'
        })
        continue
      }

      // Check All words present
      let matchedCount = 0
      for (const token of queryTokens) {
        if (item.words.has(token)) {
          matchedCount++
        } else {
          // Check substring in any word of verse
          for (const w of item.words) {
            if (w.includes(token)) {
              matchedCount += 0.7
              break
            }
          }
        }
      }

      if (matchedCount >= queryTokens.length) {
        results.push({
          verse: item.verse,
          score: 300 + matchedCount * 10,
          matchType: 'all_words'
        })
      } else if (queryTokens.length > 1 && matchedCount >= queryTokens.length * 0.6) {
        results.push({
          verse: item.verse,
          score: 100 + matchedCount * 10,
          matchType: 'partial'
        })
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, limit)
  }
}
