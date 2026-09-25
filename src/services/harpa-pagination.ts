import type { HarpaHymn } from '../types/harpa'

export type HarpaPageBlock =
  | { type: 'hymn_head'; hymnNumber: number; title: string }
  | { type: 'stanza'; hymnNumber: number; index: number; lines: string[] }
  | { type: 'chorus'; hymnNumber: number; lines: string[] }

export interface HarpaPage {
  pageNumber: number
  blocks: HarpaPageBlock[]
  startHymn: number
  endHymn: number
}

/**
 * Paginates hymns into book pages, exactly one hymn per page like the printed
 * hymnal. A single hymn always fits one paper sheet in any window size, so
 * pages never clip text and never need inner scrolling. Hymns are atomic by
 * construction: every page starts with its own hymn heading.
 */
export function paginateHymns(
  hymns: HarpaHymn[],
  charsPerPage: number,
  firstPageNumber = 1
): HarpaPage[] {
  void charsPerPage
  return hymns.map((hymn, index) => {
    const blocks: HarpaPageBlock[] = [
      { type: 'hymn_head', hymnNumber: hymn.number, title: hymn.title }
    ]
    hymn.stanzas.forEach((lines, stanzaIndex) => {
      blocks.push({ type: 'stanza', hymnNumber: hymn.number, index: stanzaIndex, lines })
    })
    if (hymn.chorus) {
      blocks.push({ type: 'chorus', hymnNumber: hymn.number, lines: hymn.chorus })
    }
    return {
      pageNumber: firstPageNumber + index,
      blocks,
      startHymn: hymn.number,
      endHymn: hymn.number
    }
  })
}
