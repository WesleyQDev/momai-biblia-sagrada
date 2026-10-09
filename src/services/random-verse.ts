import { bibleData } from './bible-data'
import { CURATED_PASSAGES } from './curated-verse-refs'
import type { BibleVerse, Testament } from '../types/bible'

export const randomVerseService = {
  getRandomVerse(filterTestament?: Testament | 'ALL'): BibleVerse {
    // 70% chance to select a curated verse for high devocional quality
    const useCurated = Math.random() < 0.7

    if (useCurated) {
      let filtered = CURATED_PASSAGES
      if (filterTestament && filterTestament !== 'ALL') {
        filtered = CURATED_PASSAGES.filter((p) => {
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
