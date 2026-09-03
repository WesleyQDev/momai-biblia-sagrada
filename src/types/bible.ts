export type Testament = 'AT' | 'NT'

export interface RawBibleBook {
  id: number
  name: string
  abbrev: string
  testament: Testament
  totalChapters: number
  chapters: string[][]
}

export interface BibleBookInfo {
  id: number
  name: string
  abbrev: string
  testament: Testament
  totalChapters: number
}

export interface BibleVerse {
  id: string
  bookId: number
  bookName: string
  bookAbbrev: string
  testament: Testament
  chapter: number
  verse: number
  text: string
}

export interface SearchResult {
  verse: BibleVerse
  score: number
  matchType: 'exact_reference' | 'exact_phrase' | 'all_words' | 'partial'
  highlightRange?: [number, number]
}

export interface ParsedReference {
  bookQuery: string
  book?: BibleBookInfo
  chapter?: number
  verse?: number
  endVerse?: number
}
