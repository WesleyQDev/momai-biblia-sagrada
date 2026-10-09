import type {
  BibleBookInfo,
  BibleVerse,
  ParsedReference,
  RawBibleBook,
  SearchMatchType,
  Testament
} from '../types/bible'

/**
 * Pure search primitives shared by the reader UI and the background worker.
 *
 * Nothing here touches window, localStorage, bundled JSON or the SDK: callers
 * pass the books (active translation) in and receive plain results, so the AI
 * and the screen always search with the same normalization and scoring.
 */

export const DEFAULT_SEARCH_LIMIT = 10
export const MAX_SEARCH_LIMIT = 50

export function clampSearchLimit(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num <= 0) return DEFAULT_SEARCH_LIMIT
  return Math.min(MAX_SEARCH_LIMIT, Math.floor(num))
}

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Book-name key: accent- and separator-insensitive ("1 João" === "1joao"). */
export function normalizeBookKey(text: string): string {
  return normalizeSearchText(text).replace(/ /g, '')
}

/**
 * Portuguese book aliases mapped to canonical book ids (1-66). Ids are stable
 * across every bundled translation, so an alias resolved here keeps working
 * after the reader switches from Almeida to KJV, Segond, etc.
 */
export const PT_BOOK_ALIASES: Record<string, number> = {
  genesis: 1,
  exodo: 2,
  salmo: 19,
  salmos: 19,
  proverbio: 20,
  proverbios: 20,
  cantico: 22,
  canticos: 22,
  cantares: 22,
  lamentacoes: 25,
  apocalipse: 66,
  mateus: 40,
  marcos: 41,
  lucas: 42,
  joao: 43,
  atos: 44,
  romanos: 45,
  hebreus: 58,
  tiago: 59,
  judas: 65,
  '1joao': 62,
  '2joao': 63,
  '3joao': 64,
  '1pedro': 60,
  '2pedro': 61,
  '1corintios': 46,
  '2corintios': 47,
  '1tessalonicenses': 52,
  '2tessalonicenses': 53,
  '1timoteo': 54,
  '2timoteo': 55,
  '1samuel': 9,
  '2samuel': 10,
  '1reis': 11,
  '2reis': 12,
  '1cronicas': 13,
  '2cronicas': 14
}

export type BookLookup = Map<string, RawBibleBook>

export function buildBookLookup(
  books: RawBibleBook[],
  aliases: Record<string, number> = PT_BOOK_ALIASES
): BookLookup {
  const lookup: BookLookup = new Map()
  for (const book of books) {
    lookup.set(String(book.id), book)
    lookup.set(normalizeBookKey(book.name), book)
    lookup.set(normalizeBookKey(book.abbrev), book)
  }
  for (const [alias, bookId] of Object.entries(aliases)) {
    const target = books[bookId - 1]
    if (target) lookup.set(normalizeBookKey(alias), target)
  }
  return lookup
}

export function findBook(
  lookup: BookLookup,
  query: string | number,
  books?: RawBibleBook[]
): RawBibleBook | undefined {
  if (typeof query === 'number') return books?.[query - 1]
  const clean = normalizeBookKey(String(query ?? ''))
  if (!clean) return undefined
  return lookup.get(clean)
}

function toBookInfo(book: RawBibleBook): BibleBookInfo {
  return {
    id: book.id,
    name: book.name,
    abbrev: book.abbrev,
    testament: book.testament,
    totalChapters: book.totalChapters
  }
}

export interface IndexedVerse {
  verse: BibleVerse
  normText: string
  words: Set<string>
}

export function buildVerseIndex(books: RawBibleBook[]): IndexedVerse[] {
  const indexed: IndexedVerse[] = []
  for (const book of books) {
    for (let cIdx = 0; cIdx < book.chapters.length; cIdx++) {
      const chapterNum = cIdx + 1
      const verses = book.chapters[cIdx]
      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        const text = verses[vIdx]
        const normText = normalizeSearchText(text)
        indexed.push({
          verse: {
            id: `${book.abbrev}-${chapterNum}-${vIdx + 1}`,
            bookId: book.id,
            bookName: book.name,
            bookAbbrev: book.abbrev,
            testament: book.testament,
            chapter: chapterNum,
            verse: vIdx + 1,
            text
          },
          normText,
          words: new Set(normText.split(' ').filter(Boolean))
        })
      }
    }
  }
  return indexed
}

export function getVerseFromBooks(
  books: RawBibleBook[],
  bookId: number,
  chapter: number,
  verse: number
): BibleVerse | undefined {
  const book = books[bookId - 1]
  if (!book) return undefined
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return undefined
  if (chapter < 1 || chapter > book.chapters.length) return undefined
  const verses = book.chapters[chapter - 1] || []
  if (verse < 1 || verse > verses.length) return undefined
  return {
    id: `${book.abbrev}-${chapter}-${verse}`,
    bookId: book.id,
    bookName: book.name,
    bookAbbrev: book.abbrev,
    testament: book.testament,
    chapter,
    verse,
    text: verses[verse - 1]
  }
}

export function getChapterFromBooks(books: RawBibleBook[], bookId: number, chapter: number): BibleVerse[] {
  const book = books[bookId - 1]
  if (!book) return []
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters.length) return []
  const texts = book.chapters[chapter - 1] || []
  return texts.map((text, idx) => ({
    id: `${book.abbrev}-${chapter}-${idx + 1}`,
    bookId: book.id,
    bookName: book.name,
    bookAbbrev: book.abbrev,
    testament: book.testament,
    chapter,
    verse: idx + 1,
    text
  }))
}

export function parseVerseReference(query: string, lookup: BookLookup): ParsedReference | null {
  const clean = query.trim()
  if (!clean) return null

  // "João 3:16", "1 Jo 3:16", "Sl 23:1", "1 Co 13:4-7", "Jo 3 16"
  const refMatch = clean.match(/^([1-3]?\s*[a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(\d+)[:\s]+(\d+)(?:-(\d+))?$/i)
  if (refMatch) {
    const bookQuery = refMatch[1].trim()
    const book = findBook(lookup, bookQuery)
    if (book) {
      return {
        bookQuery,
        book: toBookInfo(book),
        chapter: parseInt(refMatch[2], 10),
        verse: parseInt(refMatch[3], 10),
        endVerse: refMatch[4] ? parseInt(refMatch[4], 10) : undefined
      }
    }
  }

  // "Salmos 23", "Jo 3", "Gênesis 1"
  const chapMatch = clean.match(/^([1-3]?\s*[a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(\d+)$/i)
  if (chapMatch) {
    const bookQuery = chapMatch[1].trim()
    const book = findBook(lookup, bookQuery)
    if (book) {
      return {
        bookQuery,
        book: toBookInfo(book),
        chapter: parseInt(chapMatch[2], 10)
      }
    }
  }

  // Just the book name: "Gênesis", "Romanos", "Salmos"
  const bookOnly = findBook(lookup, clean)
  if (bookOnly) {
    return { bookQuery: clean, book: toBookInfo(bookOnly) }
  }

  return null
}

export interface VerseSearchHit {
  verse: BibleVerse
  score: number
  matchType: SearchMatchType
  snippet: string
}

export interface VerseSearchOptions {
  testament?: Testament | 'ALL'
  limit?: number
}

/**
 * Reference-aware full-text search over a prebuilt verse index. Mirrors the
 * reader behavior: exact phrase, then all words, partial words and substring.
 */
export function searchVerseIndex(
  index: IndexedVerse[],
  query: string,
  options: VerseSearchOptions = {}
): VerseSearchHit[] {
  const rawQuery = query.trim()
  if (!rawQuery) return []

  const limit = clampSearchLimit(options.limit ?? DEFAULT_SEARCH_LIMIT)
  const testament = options.testament === 'AT' || options.testament === 'NT' ? options.testament : 'ALL'
  const hits: VerseSearchHit[] = []

  const normQuery = normalizeSearchText(rawQuery)
  const paddedQuery = ` ${normQuery} `
  const queryTokens = normQuery.split(' ').filter((token) => token.length > 0)
  if (queryTokens.length === 0) return []

  for (const item of index) {
    if (testament !== 'ALL' && item.verse.testament !== testament) continue

    const paddedNormText = ` ${item.normText} `

    if (paddedNormText.includes(paddedQuery)) {
      hits.push({
        verse: item.verse,
        score: 550 + 100 / (item.normText.length + 1),
        matchType: 'exact_phrase',
        snippet: item.verse.text
      })
      continue
    }

    let exactWordsCount = 0
    let partialWordsCount = 0
    for (const token of queryTokens) {
      if (item.words.has(token)) {
        exactWordsCount++
      } else {
        for (const word of item.words) {
          if (word.includes(token)) {
            partialWordsCount++
            break
          }
        }
      }
    }

    if (exactWordsCount === queryTokens.length) {
      hits.push({
        verse: item.verse,
        score: 400 + exactWordsCount * 10,
        matchType: 'all_words',
        snippet: item.verse.text
      })
      continue
    }

    if (exactWordsCount + partialWordsCount >= queryTokens.length) {
      hits.push({
        verse: item.verse,
        score: 250 + exactWordsCount * 10 + partialWordsCount * 5,
        matchType: 'all_words',
        snippet: item.verse.text
      })
      continue
    }

    if (item.normText.includes(normQuery)) {
      hits.push({
        verse: item.verse,
        score: 80 + 50 / (item.normText.length + 1),
        matchType: 'partial',
        snippet: item.verse.text
      })
    }
  }

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit)
}

/**
 * Exact-reference hits (verse range, whole chapter or first verses of a book),
 * scored above every text match. Returns [] when the reference does not map to
 * the dataset.
 */
export function searchReference(
  books: RawBibleBook[],
  reference: ParsedReference,
  limit: number
): VerseSearchHit[] {
  const book = reference.book
  if (!book) return []
  const hits: VerseSearchHit[] = []

  if (reference.chapter && reference.verse) {
    const verse = getVerseFromBooks(books, book.id, reference.chapter, reference.verse)
    if (verse) {
      hits.push({ verse, score: 1000, matchType: 'exact_reference', snippet: verse.text })
    }
    if (reference.endVerse && reference.endVerse > reference.verse) {
      for (let v = reference.verse + 1; v <= reference.endVerse; v++) {
        const rangeVerse = getVerseFromBooks(books, book.id, reference.chapter, v)
        if (rangeVerse) {
          hits.push({
            verse: rangeVerse,
            score: 950 - v,
            matchType: 'exact_reference',
            snippet: rangeVerse.text
          })
        }
      }
    }
    return hits
  }

  if (reference.chapter) {
    const chapterVerses = getChapterFromBooks(books, book.id, reference.chapter)
    for (const verse of chapterVerses.slice(0, Math.min(limit, 10))) {
      hits.push({
        verse,
        score: 800 - verse.verse,
        matchType: 'exact_reference',
        snippet: verse.text
      })
    }
    return hits
  }

  const firstChapter = getChapterFromBooks(books, book.id, 1)
  for (const verse of firstChapter.slice(0, Math.min(limit, 5))) {
    hits.push({
      verse,
      score: 700 - verse.verse,
      matchType: 'exact_reference',
      snippet: verse.text
    })
  }
  return hits
}
