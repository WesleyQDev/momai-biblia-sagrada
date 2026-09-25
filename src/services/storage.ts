import type { BibleBookmark } from '../types/bookmarks'
import type { BibleDailyTracker, ReadingProgress, TodayCompletedChapter } from '../types/reading'
import { isBibleLanguageId, type BibleLanguageId } from './bible-languages'
import { bibleData } from './bible-data'

const PREFIX = 'momai_biblia_v1_'

export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


// Total hymns in the Harpa Cristã dataset (assets/harpa/harpa-crista.json).
// Bounds keep a corrupted value from opening a missing hymn screen.
const HARPA_TOTAL_HYMNS = 640

const memoryFallback = new Map<string, string>()

function readValue(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key)
    }
  } catch {
    // Private mode or unavailable storage falls through to memory
  }
  return memoryFallback.has(key) ? memoryFallback.get(key)! : null
}

function writeValue(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value)
      return
    }
  } catch (e) {
    console.warn('[biblia:storage] Failed to save preference:', e)
  }
  memoryFallback.set(key, value)
}

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
  },

  getBibleLanguageId(): BibleLanguageId | null {
    const saved = readValue(`${PREFIX}bible_language`)
    return isBibleLanguageId(saved) ? saved : null
  },

  setBibleLanguageId(id: BibleLanguageId): void {
    if (!isBibleLanguageId(id)) return
    writeValue(`${PREFIX}bible_language`, id)
  },

  getLastHymn(): number {
    const saved = Number(readValue(`${PREFIX}harpa_last_hymn`))
    return Number.isInteger(saved) && saved >= 1 && saved <= HARPA_TOTAL_HYMNS ? saved : 1
  },

  setLastHymn(number: number): void {
    if (!Number.isInteger(number) || number < 1 || number > HARPA_TOTAL_HYMNS) return
    writeValue(`${PREFIX}harpa_last_hymn`, String(number))
  },

  getHymnFavorites(): number[] {
    const saved = readValue(`${PREFIX}harpa_favorites`)
    if (!saved) return []
    try {
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) return []
      return parsed.filter(
        (value): value is number => Number.isInteger(value) && value >= 1 && value <= HARPA_TOTAL_HYMNS
      )
    } catch {
      return []
    }
  },

  isHymnFavorite(number: number): boolean {
    return this.getHymnFavorites().includes(number)
  },

  addHymnFavorite(number: number): void {
    if (!Number.isInteger(number) || number < 1 || number > HARPA_TOTAL_HYMNS) return
    const favorites = this.getHymnFavorites()
    if (favorites.includes(number)) return
    writeValue(`${PREFIX}harpa_favorites`, JSON.stringify([number, ...favorites]))
  },

  removeHymnFavorite(number: number): void {
    const favorites = this.getHymnFavorites().filter((value) => value !== number)
    writeValue(`${PREFIX}harpa_favorites`, JSON.stringify(favorites))
  },

  getTextZoom(): number {
    const raw = readValue(`${PREFIX}text_zoom`)
    const val = raw ? parseFloat(raw) : 0.95
    return Number.isFinite(val) && val >= 0.75 && val <= 1.8 ? val : 0.95
  },

  setTextZoom(zoom: number): void {
    if (!Number.isFinite(zoom)) return
    const clamped = Math.max(0.75, Math.min(1.8, +zoom.toFixed(2)))
    writeValue(`${PREFIX}text_zoom`, String(clamped))
  },

  getDailyTracker(): BibleDailyTracker {
    const today = getTodayDateString()
    const raw = readValue(`${PREFIX}daily_tracker`)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<BibleDailyTracker>
        const dailyGoal = Math.max(1, Math.min(20, Number(parsed.dailyGoal) || 3))
        const currentBookId = Number(parsed.currentBookId) || 1
        const currentChapter = Number(parsed.currentChapter) || 1
        const totalChaptersRead = Number(parsed.totalChaptersRead) || 0
        const streakDays = Number(parsed.streakDays) || 0
        const lastStreakDate = typeof parsed.lastStreakDate === 'string' ? parsed.lastStreakDate : ''
        const lastActiveDate = typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : today

        // If today is a new day compared to last active date, reset today's session
        if (lastActiveDate !== today) {
          const updated: BibleDailyTracker = {
            currentBookId,
            currentChapter,
            dailyGoal,
            completedToday: 0,
            lastActiveDate: today,
            totalChaptersRead,
            streakDays,
            lastStreakDate,
            todayCompletedChapters: []
          }
          this.setDailyTracker(updated)
          return updated
        }

        return {
          currentBookId,
          currentChapter,
          dailyGoal,
          completedToday: Number(parsed.completedToday) || 0,
          lastActiveDate: today,
          totalChaptersRead,
          streakDays,
          lastStreakDate,
          todayCompletedChapters: Array.isArray(parsed.todayCompletedChapters)
            ? (parsed.todayCompletedChapters as TodayCompletedChapter[])
            : []
        }
      } catch {}
    }

    // Default tracker starting from Genesis 1 or last reading
    const last = this.getLastReading()
    const initialTracker: BibleDailyTracker = {
      currentBookId: last.bookId || 1,
      currentChapter: last.chapter || 1,
      dailyGoal: 3,
      completedToday: 0,
      lastActiveDate: today,
      totalChaptersRead: 0,
      streakDays: 0,
      lastStreakDate: '',
      todayCompletedChapters: []
    }
    return initialTracker
  },

  setDailyTracker(tracker: BibleDailyTracker): void {
    try {
      writeValue(`${PREFIX}daily_tracker`, JSON.stringify(tracker))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('momai_biblia_tracker_update', { detail: tracker }))
      }
    } catch (e) {
      console.warn('[biblia:storage] Failed to save daily tracker:', e)
    }
  },

  advanceDailyTracker(customGoal?: number): BibleDailyTracker {
    const tracker = this.getDailyTracker()
    const today = getTodayDateString()
    const targetGoal = customGoal && customGoal > 0 ? customGoal : tracker.dailyGoal || 3

    // Record currently completed chapter
    const completedItem: TodayCompletedChapter = {
      bookId: tracker.currentBookId,
      chapter: tracker.currentChapter,
      completedAt: Date.now()
    }
    const todayChapters = [...tracker.todayCompletedChapters, completedItem]
    const nextCompletedToday = tracker.completedToday + 1
    const nextTotalRead = tracker.totalChaptersRead + 1

    let nextStreakDays = tracker.streakDays
    let nextLastStreakDate = tracker.lastStreakDate
    if (nextCompletedToday >= targetGoal && tracker.lastStreakDate !== today) {
      nextStreakDays += 1
      nextLastStreakDate = today
    }

    // Calculate next chapter
    const nextStep = bibleData.getNextChapter(tracker.currentBookId, tracker.currentChapter)
    const nextBookId = nextStep ? nextStep.bookId : 1
    const nextChapter = nextStep ? nextStep.chapter : 1

    const updated: BibleDailyTracker = {
      currentBookId: nextBookId,
      currentChapter: nextChapter,
      dailyGoal: targetGoal,
      completedToday: nextCompletedToday,
      lastActiveDate: today,
      totalChaptersRead: nextTotalRead,
      streakDays: nextStreakDays,
      lastStreakDate: nextLastStreakDate,
      todayCompletedChapters: todayChapters
    }

    this.setDailyTracker(updated)

    // Also synchronize lastReading in storage so main reader opens right at the new chapter
    const nextBook = bibleData.getBookById(nextBookId)
    if (nextBook) {
      this.setLastReading({
        bookId: nextBookId,
        bookName: nextBook.name,
        bookAbbrev: nextBook.abbrev,
        testament: nextBook.testament,
        chapter: nextChapter,
        verse: 1,
        updatedAt: Date.now()
      })
    }

    return updated
  },

  resetDailyTrackerToday(): BibleDailyTracker {
    const tracker = this.getDailyTracker()
    const today = getTodayDateString()
    const updated: BibleDailyTracker = {
      ...tracker,
      completedToday: 0,
      lastActiveDate: today,
      todayCompletedChapters: []
    }
    this.setDailyTracker(updated)
    return updated
  },

  resetEntireBibleReading(): BibleDailyTracker {
    const tracker = this.getDailyTracker()
    const today = getTodayDateString()
    const updated: BibleDailyTracker = {
      currentBookId: 1,
      currentChapter: 1,
      dailyGoal: tracker.dailyGoal || 3,
      completedToday: 0,
      lastActiveDate: today,
      totalChaptersRead: 0,
      streakDays: 0,
      lastStreakDate: '',
      todayCompletedChapters: []
    }
    this.setDailyTracker(updated)

    const gen = bibleData.getBookById(1)
    if (gen) {
      this.setLastReading({
        bookId: 1,
        bookName: gen.name,
        bookAbbrev: gen.abbrev,
        testament: gen.testament,
        chapter: 1,
        verse: 1,
        updatedAt: Date.now()
      })
    }

    return updated
  },

  setDailyGoal(goal: number): BibleDailyTracker {
    const tracker = this.getDailyTracker()
    const clamped = Math.max(1, Math.min(20, goal))
    const updated: BibleDailyTracker = {
      ...tracker,
      dailyGoal: clamped
    }
    this.setDailyTracker(updated)
    return updated
  }
}

