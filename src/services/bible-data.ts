import almeidaBooks from '../../assets/bible/almeida.json'
import type { RawBibleBook, BibleBookInfo, BibleVerse, Testament } from '../types/bible'
import {
  DEFAULT_BIBLE_LANGUAGE_ID,
  isBibleLanguageId,
  type BibleLanguageId
} from './bible-languages'
import {
  buildBookLookup,
  findBook as findBookInLookup,
  getChapterFromBooks,
  getVerseFromBooks,
  type BookLookup
} from './bible-search-core'

// Only the default translation ships in the initial bundle. The other five are
// code-split and fetched the first time the reader (or the widget) selects
// them, so opening the Bible no longer parses every translation up front.
const datasetLoaders: Record<BibleLanguageId, () => Promise<{ default: RawBibleBook[] }>> = {
  'pt-BR': async () => ({ default: almeidaBooks as RawBibleBook[] }),
  'en-US': async () => ({ default: (await import('../../assets/bible/kjv.json')).default as RawBibleBook[] }),
  es: async () => ({ default: (await import('../../assets/bible/rv1909.json')).default as RawBibleBook[] }),
  fr: async () => ({ default: (await import('../../assets/bible/lsg.json')).default as RawBibleBook[] }),
  de: async () => ({ default: (await import('../../assets/bible/luth1912.json')).default as RawBibleBook[] }),
  it: async () => ({ default: (await import('../../assets/bible/riveduta.json')).default as RawBibleBook[] })
}

const datasetCache = new Map<BibleLanguageId, RawBibleBook[]>([
  [DEFAULT_BIBLE_LANGUAGE_ID, almeidaBooks as RawBibleBook[]]
])

let activeLanguageId: BibleLanguageId = DEFAULT_BIBLE_LANGUAGE_ID
let activeBooks: RawBibleBook[] = almeidaBooks as RawBibleBook[]
let bookLookup: BookLookup = buildBookLookup(activeBooks)
let datasetVersion = 0
const listeners = new Set<() => void>()

function setActiveDataset(id: BibleLanguageId, books: RawBibleBook[]): void {
  activeLanguageId = id
  activeBooks = books
  bookLookup = buildBookLookup(books)
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

function isValidDataset(books: unknown): books is RawBibleBook[] {
  return (
    Array.isArray(books) &&
    books.length === 66 &&
    books.every(
      (b) =>
        b &&
        typeof b === 'object' &&
        Array.isArray((b as RawBibleBook).chapters) &&
        (b as RawBibleBook).chapters.length > 0
    )
  )
}

export const bibleData = {
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

  loadBibleLanguage(id: BibleLanguageId): Promise<void> {
    if (!isBibleLanguageId(id)) {
      return Promise.reject(new Error(`Unknown Bible language: ${String(id)}`))
    }
    const cached = datasetCache.get(id)
    if (cached && activeLanguageId === id) return Promise.resolve()
    if (cached) {
      if (!isValidDataset(cached)) {
        return Promise.reject(new Error(`Invalid bundled Bible dataset for ${id}`))
      }
      setActiveDataset(id, cached)
      return Promise.resolve()
    }
    const load = datasetLoaders[id]
    if (!load) {
      return Promise.reject(new Error(`Bible translation for ${id} is not available`))
    }
    return load()
      .then((mod) => {
        const books = mod.default
        if (!isValidDataset(books)) {
          throw new Error(`Invalid bundled Bible dataset for ${id}`)
        }
        datasetCache.set(id, books)
        setActiveDataset(id, books)
      })
      .catch((err) => {
        throw err instanceof Error ? err : new Error(`Failed to load Bible dataset for ${id}`)
      })
  },

  getAllBooks(): BibleBookInfo[] {
    return activeBooks.map((b) => ({
      id: b.id,
      name: b.name,
      abbrev: b.abbrev,
      testament: b.testament,
      totalChapters: b.totalChapters
    }))
  },

  getOldTestamentBooks(): BibleBookInfo[] {
    return this.getAllBooks().filter((b) => b.testament === 'AT')
  },

  getNewTestamentBooks(): BibleBookInfo[] {
    return this.getAllBooks().filter((b) => b.testament === 'NT')
  },

  findBook(query: string | number): RawBibleBook | undefined {
    return findBookInLookup(bookLookup, query, activeBooks)
  },

  getLookup(): BookLookup {
    return bookLookup
  },

  getActiveBooks(): RawBibleBook[] {
    return activeBooks
  },

  getBookById(bookId: number): RawBibleBook | undefined {
    return activeBooks[bookId - 1]
  },

  getChapterVerses(bookId: number, chapter: number): BibleVerse[] {
    return getChapterFromBooks(activeBooks, bookId, chapter)
  },

  getVerse(bookId: number, chapter: number, verse: number): BibleVerse | undefined {
    return getVerseFromBooks(activeBooks, bookId, chapter, verse)
  },

  getNextChapter(bookId: number, chapter: number): { bookId: number; chapter: number } | null {
    const book = this.getBookById(bookId)
    if (!book) return null

    if (chapter < book.totalChapters) {
      return { bookId, chapter: chapter + 1 }
    }

    // Boundary to next book
    if (bookId < 66) {
      return { bookId: bookId + 1, chapter: 1 }
    }

    // End of Revelation
    return null
  },

  getPrevChapter(bookId: number, chapter: number): { bookId: number; chapter: number } | null {
    const book = this.getBookById(bookId)
    if (!book) return null

    if (chapter > 1) {
      return { bookId, chapter: chapter - 1 }
    }

    // Boundary to previous book
    if (bookId > 1) {
      const prevBook = this.getBookById(bookId - 1)
      if (prevBook) {
        return { bookId: prevBook.id, chapter: prevBook.totalChapters }
      }
    }

    // Beginning of Genesis
    return null
  }
}

export type { Testament }
