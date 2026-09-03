import rawBooks from '../../assets/bible/almeida.json'
import type { RawBibleBook, BibleBookInfo, BibleVerse, Testament } from '../types/bible'

const bibleBooks: RawBibleBook[] = rawBooks as RawBibleBook[]

// Pre-compute normalized book lookups for fast resolution
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const bookLookup = new Map<string, RawBibleBook>()
for (const b of bibleBooks) {
  bookLookup.set(String(b.id), b)
  bookLookup.set(normalizeString(b.name), b)
  bookLookup.set(normalizeString(b.abbrev), b)
}

// Common aliases for Portuguese Bible books
const aliases: Record<string, string> = {
  genesis: 'gn',
  exodo: 'ex',
  salmo: 'sl',
  salmos: 'sl',
  proverbio: 'pv',
  proverbios: 'pv',
  cantico: 'ct',
  canticos: 'ct',
  cantares: 'ct',
  lamentacoes: 'lm',
  apocalipse: 'ap',
  mateus: 'mt',
  marcos: 'mc',
  lucas: 'lc',
  joao: 'jo',
  atos: 'atos',
  romanos: 'rm',
  hebreus: 'hb',
  tiago: 'tg',
  judas: 'jd',
  '1joao': '1jo',
  '2joao': '2jo',
  '3joao': '3jo',
  '1pedro': '1pe',
  '2pedro': '2pe',
  '1corintios': '1co',
  '2corintios': '2co',
  '1tessalonicenses': '1ts',
  '2tessalonicenses': '2ts',
  '1timoteo': '1tm',
  '2timoteo': '2tm',
  '1samuel': '1sm',
  '2samuel': '2sm',
  '1reis': '1rs',
  '2reis': '2rs',
  '1cronicas': '1cr',
  '2cronicas': '2cr'
}

for (const [alias, targetAbbrev] of Object.entries(aliases)) {
  const target = bookLookup.get(targetAbbrev)
  if (target) {
    bookLookup.set(alias, target)
  }
}

export const bibleData = {
  getAllBooks(): BibleBookInfo[] {
    return bibleBooks.map((b) => ({
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
    if (typeof query === 'number') {
      return bibleBooks[query - 1]
    }
    const clean = normalizeString(String(query))
    return bookLookup.get(clean)
  },

  getBookById(bookId: number): RawBibleBook | undefined {
    return bibleBooks[bookId - 1]
  },

  getChapterVerses(bookId: number, chapter: number): BibleVerse[] {
    const book = this.getBookById(bookId)
    if (!book) return []
    if (chapter < 1 || chapter > book.chapters.length) return []
    
    const verseTexts = book.chapters[chapter - 1] || []
    return verseTexts.map((text, idx) => ({
      id: `${book.abbrev}-${chapter}-${idx + 1}`,
      bookId: book.id,
      bookName: book.name,
      bookAbbrev: book.abbrev,
      testament: book.testament,
      chapter,
      verse: idx + 1,
      text
    }))
  },

  getVerse(bookId: number, chapter: number, verse: number): BibleVerse | undefined {
    const verses = this.getChapterVerses(bookId, chapter)
    return verses.find((v) => v.verse === verse)
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
