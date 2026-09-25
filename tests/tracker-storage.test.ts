// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { bibleStorage, getTodayDateString } from '../src/services/storage'

describe('Bible Daily Tracker Storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with default values starting from Genesis 1 or last reading', () => {
    const tracker = bibleStorage.getDailyTracker()
    expect(tracker.currentBookId).toBe(43) // defaults to John or Genesis
    expect(tracker.currentChapter).toBe(1)
    expect(tracker.dailyGoal).toBe(3)
    expect(tracker.completedToday).toBe(0)
    expect(tracker.streakDays).toBe(0)
    expect(tracker.todayCompletedChapters).toEqual([])
  })

  it('advances chapter and increments progress on advanceDailyTracker', () => {
    const initial = bibleStorage.getDailyTracker()
    const updated = bibleStorage.advanceDailyTracker(3)

    expect(updated.completedToday).toBe(1)
    expect(updated.totalChaptersRead).toBe(1)
    expect(updated.todayCompletedChapters).toHaveLength(1)
    expect(updated.todayCompletedChapters[0].bookId).toBe(initial.currentBookId)
    expect(updated.todayCompletedChapters[0].chapter).toBe(initial.currentChapter)
    expect(updated.currentChapter).toBe(initial.currentChapter + 1)
  })

  it('increments streak when daily goal is achieved', () => {
    bibleStorage.setDailyGoal(2)
    bibleStorage.advanceDailyTracker(2)
    const afterFirst = bibleStorage.getDailyTracker()
    expect(afterFirst.streakDays).toBe(0)

    const afterSecond = bibleStorage.advanceDailyTracker(2)
    expect(afterSecond.completedToday).toBe(2)
    expect(afterSecond.streakDays).toBe(1)
    expect(afterSecond.lastStreakDate).toBe(getTodayDateString())
  })

  it('resets completedToday on a new calendar day without losing the current chapter', () => {
    // Simulate reading 2 chapters yesterday
    const yesterday = '2026-09-23'
    bibleStorage.setDailyTracker({
      currentBookId: 1,
      currentChapter: 15,
      dailyGoal: 3,
      completedToday: 2,
      lastActiveDate: yesterday,
      totalChaptersRead: 14,
      streakDays: 1,
      lastStreakDate: yesterday,
      todayCompletedChapters: [{ bookId: 1, chapter: 13 }, { bookId: 1, chapter: 14 }]
    })

    // On today, getDailyTracker is called
    const todayTracker = bibleStorage.getDailyTracker()
    expect(todayTracker.currentBookId).toBe(1)
    expect(todayTracker.currentChapter).toBe(15) // Still at Genesis 15!
    expect(todayTracker.completedToday).toBe(0) // Reset for the new day
    expect(todayTracker.todayCompletedChapters).toEqual([])
    expect(todayTracker.lastActiveDate).toBe(getTodayDateString())
  })

  it('resets today session with resetDailyTrackerToday', () => {
    bibleStorage.advanceDailyTracker(3)
    expect(bibleStorage.getDailyTracker().completedToday).toBe(1)

    const reset = bibleStorage.resetDailyTrackerToday()
    expect(reset.completedToday).toBe(0)
    expect(reset.todayCompletedChapters).toEqual([])
  })
})
