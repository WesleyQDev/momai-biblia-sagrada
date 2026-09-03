import { bibleData } from './bible-data'
import type { BibleVerse, Testament } from '../types/bible'

// Curated list of well-known, complete, uplifting passages
const curatedPassages: Array<{ book: string; chapter: number; verse: number }> = [
  { book: 'jo', chapter: 3, verse: 16 },
  { book: 'sl', chapter: 23, verse: 1 },
  { book: 'sl', chapter: 23, verse: 4 },
  { book: 'sl', chapter: 91, verse: 1 },
  { book: 'sl', chapter: 91, verse: 2 },
  { book: 'sl', chapter: 119, verse: 105 },
  { book: 'sl', chapter: 121, verse: 1 },
  { book: 'sl', chapter: 121, verse: 2 },
  { book: 'sl', chapter: 46, verse: 1 },
  { book: 'sl', chapter: 37, verse: 5 },
  { book: 'pv', chapter: 3, verse: 5 },
  { book: 'pv', chapter: 3, verse: 6 },
  { book: 'pv', chapter: 16, verse: 3 },
  { book: 'pv', chapter: 18, verse: 10 },
  { book: 'is', chapter: 40, verse: 31 },
  { book: 'is', chapter: 41, verse: 10 },
  { book: 'jr', chapter: 29, verse: 11 },
  { book: 'mt', chapter: 6, verse: 33 },
  { book: 'mt', chapter: 11, verse: 28 },
  { book: 'mt', chapter: 28, verse: 20 },
  { book: 'rm', chapter: 8, verse: 28 },
  { book: 'rm', chapter: 8, verse: 31 },
  { book: 'rm', chapter: 8, verse: 38 },
  { book: 'rm', chapter: 12, verse: 2 },
  { book: '1co', chapter: 13, verse: 4 },
  { book: '1co', chapter: 13, verse: 13 },
  { book: '2co', chapter: 5, verse: 17 },
  { book: '2co', chapter: 12, verse: 9 },
  { book: 'gl', chapter: 2, verse: 20 },
  { book: 'gl', chapter: 5, verse: 22 },
  { book: 'ef', chapter: 2, verse: 8 },
  { book: 'fp', chapter: 4, verse: 6 },
  { book: 'fp', chapter: 4, verse: 13 },
  { book: 'cl', chapter: 3, verse: 14 },
  { book: 'cl', chapter: 3, verse: 23 },
  { book: '1ts', chapter: 5, verse: 16 },
  { book: '1ts', chapter: 5, verse: 17 },
  { book: '1ts', chapter: 5, verse: 18 },
  { book: '2tm', chapter: 1, verse: 7 },
  { book: 'hb', chapter: 11, verse: 1 },
  { book: 'hb', chapter: 12, verse: 2 },
  { book: 'tg', chapter: 1, verse: 5 },
  { book: '1pe', chapter: 5, verse: 7 },
  { book: '1jo', chapter: 4, verse: 19 },
  { book: 'ap', chapter: 21, verse: 4 }
]

export const randomVerseService = {
  getRandomVerse(filterTestament?: Testament | 'ALL'): BibleVerse {
    // 70% chance to select a curated verse for high devocional quality
    const useCurated = Math.random() < 0.7

    if (useCurated) {
      let filtered = curatedPassages
      if (filterTestament && filterTestament !== 'ALL') {
        filtered = curatedPassages.filter((p) => {
          const book = bibleData.findBook(p.book)
          return book && book.testament === filterTestament
        })
      }
      if (filtered.length > 0) {
        const item = filtered[Math.floor(Math.random() * filtered.length)]
        const book = bibleData.findBook(item.book)
        if (book) {
          const verse = bibleData.getVerse(book.id, item.chapter, item.verse)
          if (verse) return verse
        }
      }
    }

    // Otherwise select a random complete verse from the entire canon
    const books =
      filterTestament === 'AT'
        ? bibleData.getOldTestamentBooks()
        : filterTestament === 'NT'
          ? bibleData.getNewTestamentBooks()
          : bibleData.getAllBooks()

    // Try a few times to find a verse of ideal reading length (40 to 220 chars)
    for (let attempts = 0; attempts < 10; attempts++) {
      const randomBookInfo = books[Math.floor(Math.random() * books.length)]
      const rawBook = bibleData.getBookById(randomBookInfo.id)
      if (!rawBook || rawBook.chapters.length === 0) continue

      const randomChapter = Math.floor(Math.random() * rawBook.chapters.length) + 1
      const verses = rawBook.chapters[randomChapter - 1]
      if (!verses || verses.length === 0) continue

      const randomVerseNum = Math.floor(Math.random() * verses.length) + 1
      const text = verses[randomVerseNum - 1]

      if (text && text.length >= 30 && text.length <= 260) {
        return {
          id: `${rawBook.abbrev}-${randomChapter}-${randomVerseNum}`,
          bookId: rawBook.id,
          bookName: rawBook.name,
          bookAbbrev: rawBook.abbrev,
          testament: rawBook.testament,
          chapter: randomChapter,
          verse: randomVerseNum,
          text
        }
      }
    }

    // Fallback: João 3:16
    const joao = bibleData.findBook('jo')!
    return bibleData.getVerse(joao.id, 3, 16)!
  }
}
