import { bibleData } from './bible-data'
import type { BibleVerse, Testament } from '../types/bible'

// Curated list of well-known, complete, uplifting passages (stable book ids 1-66)
const curatedPassages: Array<{ bookId: number; chapter: number; verse: number }> = [
  { bookId: 43, chapter: 3, verse: 16 },
  { bookId: 19, chapter: 23, verse: 1 },
  { bookId: 19, chapter: 23, verse: 4 },
  { bookId: 19, chapter: 91, verse: 1 },
  { bookId: 19, chapter: 91, verse: 2 },
  { bookId: 19, chapter: 119, verse: 105 },
  { bookId: 19, chapter: 121, verse: 1 },
  { bookId: 19, chapter: 121, verse: 2 },
  { bookId: 19, chapter: 46, verse: 1 },
  { bookId: 19, chapter: 37, verse: 5 },
  { bookId: 20, chapter: 3, verse: 5 },
  { bookId: 20, chapter: 3, verse: 6 },
  { bookId: 20, chapter: 16, verse: 3 },
  { bookId: 20, chapter: 18, verse: 10 },
  { bookId: 23, chapter: 40, verse: 31 },
  { bookId: 23, chapter: 41, verse: 10 },
  { bookId: 24, chapter: 29, verse: 11 },
  { bookId: 40, chapter: 6, verse: 33 },
  { bookId: 40, chapter: 11, verse: 28 },
  { bookId: 40, chapter: 28, verse: 20 },
  { bookId: 45, chapter: 8, verse: 28 },
  { bookId: 45, chapter: 8, verse: 31 },
  { bookId: 45, chapter: 8, verse: 38 },
  { bookId: 45, chapter: 12, verse: 2 },
  { bookId: 46, chapter: 13, verse: 4 },
  { bookId: 46, chapter: 13, verse: 13 },
  { bookId: 47, chapter: 5, verse: 17 },
  { bookId: 47, chapter: 12, verse: 9 },
  { bookId: 48, chapter: 2, verse: 20 },
  { bookId: 48, chapter: 5, verse: 22 },
  { bookId: 49, chapter: 2, verse: 8 },
  { bookId: 50, chapter: 4, verse: 6 },
  { bookId: 50, chapter: 4, verse: 13 },
  { bookId: 51, chapter: 3, verse: 14 },
  { bookId: 51, chapter: 3, verse: 23 },
  { bookId: 52, chapter: 5, verse: 16 },
  { bookId: 52, chapter: 5, verse: 17 },
  { bookId: 52, chapter: 5, verse: 18 },
  { bookId: 55, chapter: 1, verse: 7 },
  { bookId: 58, chapter: 11, verse: 1 },
  { bookId: 58, chapter: 12, verse: 2 },
  { bookId: 59, chapter: 1, verse: 5 },
  { bookId: 60, chapter: 5, verse: 7 },
  { bookId: 62, chapter: 4, verse: 19 },
  { bookId: 66, chapter: 21, verse: 4 }
]

export const randomVerseService = {
  getRandomVerse(filterTestament?: Testament | 'ALL'): BibleVerse {
    // 70% chance to select a curated verse for high devocional quality
    const useCurated = Math.random() < 0.7

    if (useCurated) {
      let filtered = curatedPassages
      if (filterTestament && filterTestament !== 'ALL') {
        filtered = curatedPassages.filter((p) => {
          const book = bibleData.getBookById(p.bookId)
          return book && book.testament === filterTestament
        })
      }
      if (filtered.length > 0) {
        const item = filtered[Math.floor(Math.random() * filtered.length)]
        const verse = bibleData.getVerse(item.bookId, item.chapter, item.verse)
        if (verse) return verse
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

    // Fallback: John 3:16
    return bibleData.getVerse(43, 3, 16)!
  }
}
