import type { BibleBookmark } from '../types/bookmarks'
import type { ReadingProgress } from '../types/reading'

const PREFIX = 'momai_biblia_v1_'

export const bibleStorage = {
  getBookmarks(): BibleBookmark[] {
    try {
      const data = localStorage.getItem(`${PREFIX}bookmarks`)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  setBookmarks(bookmarks: BibleBookmark[]): void {
    try {
      localStorage.setItem(`${PREFIX}bookmarks`, JSON.stringify(bookmarks))
    } catch (e) {
      console.warn('[biblia:storage] Failed to save bookmarks:', e)
    }
  },

  addBookmark(bookmark: Omit<BibleBookmark, 'id' | 'createdAt'>): BibleBookmark {
    const bookmarks = this.getBookmarks()
    const id = `${bookmark.bookAbbrev}-${bookmark.chapter}-${bookmark.verse}-${Date.now()}`
    const newBookmark: BibleBookmark = {
      ...bookmark,
      id,
      createdAt: Date.now()
    }
    // Avoid duplicate bookmarks for same verse
    const filtered = bookmarks.filter(
      (b) => !(b.bookId === bookmark.bookId && b.chapter === bookmark.chapter && b.verse === bookmark.verse)
    )
    filtered.unshift(newBookmark)
    this.setBookmarks(filtered)
    return newBookmark
  },

  removeBookmark(idOrRef: string): boolean {
    const bookmarks = this.getBookmarks()
    const initialLen = bookmarks.length
    const filtered = bookmarks.filter((b) => b.id !== idOrRef && `${b.bookAbbrev}-${b.chapter}-${b.verse}` !== idOrRef)
    if (filtered.length !== initialLen) {
      this.setBookmarks(filtered)
      return true
    }
    return false
  },

  isVerseBookmarked(bookId: number, chapter: number, verse: number): boolean {
    const bookmarks = this.getBookmarks()
    return bookmarks.some((b) => b.bookId === bookId && b.chapter === chapter && b.verse === verse)
  },

  getLastReading(): ReadingProgress {
    try {
      const data = localStorage.getItem(`${PREFIX}last_reading`)
      if (data) {
        return JSON.parse(data)
      }
    } catch {}

    // Default to João 1
    return {
      bookId: 43,
      bookName: 'João',
      bookAbbrev: 'jo',
      testament: 'NT',
      chapter: 1,
      verse: 1,
      updatedAt: Date.now()
    }
  },

  setLastReading(reading: ReadingProgress): void {
    try {
      localStorage.setItem(`${PREFIX}last_reading`, JSON.stringify(reading))
    } catch (e) {
      console.warn('[biblia:storage] Failed to save last reading:', e)
    }
  }
}
