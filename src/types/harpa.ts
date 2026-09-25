export interface HarpaHymn {
  number: number
  title: string
  stanzas: string[][]
  chorus?: string[]
}

export interface HarpaDataset {
  source: string
  totalHymns: number
  hymns: HarpaHymn[]
}

export type HarpaMatchType = 'number' | 'title' | 'chorus' | 'lyric'

export interface HarpaSearchResult {
  hymn: HarpaHymn
  matchType: HarpaMatchType
}
