import type { HarpaHymn } from './harpa'

export type Testament = 'AT' | 'NT'

export type SearchScope = 'ALL' | 'AT' | 'NT' | 'HARPA'

export type SearchItemType = 'verse' | 'hymn'

export type SearchMatchType =
  | 'exact_reference'
  | 'exact_phrase'
  | 'all_words'
  | 'partial'
  | 'hymn_number'
  | 'hymn_title'
  | 'hymn_chorus'
  | 'hymn_lyric'

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
  type: SearchItemType
  verse?: BibleVerse
  hymn?: HarpaHymn
  score: number
  matchType: SearchMatchType
  highlightRange?: [number, number]
  snippet?: string
}

export interface SearchOptions {
  scope?: SearchScope
  testament?: Testament | 'ALL' | 'HARPA'
  limit?: number
}

export interface ParsedReference {
  bookQuery: string
  book?: BibleBookInfo
  chapter?: number
  verse?: number
  endVerse?: number
}
