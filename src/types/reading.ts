import { Testament } from './bible'

export interface ReadingProgress {
  bookId: number
  bookName: string
  bookAbbrev: string
  testament: Testament
  chapter: number
  verse?: number
  updatedAt: number
}
export interface TodayCompletedChapter {
  bookId: number
  chapter: number
  completedAt?: number
}

export interface BibleDailyTracker {
  currentBookId: number
  currentChapter: number
  dailyGoal: number
  completedToday: number
  lastActiveDate: string
  totalChaptersRead: number
  streakDays: number
  lastStreakDate: string
  todayCompletedChapters: TodayCompletedChapter[]
}
