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
