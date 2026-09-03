import { Testament } from './bible'

export interface BibleBookmark {
  id: string
  bookId: number
  bookName: string
  bookAbbrev: string
  testament: Testament
  chapter: number
  verse: number
  text: string
  note?: string
  createdAt: number
}
