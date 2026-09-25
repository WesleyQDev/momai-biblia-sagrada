import { describe, it, expect, beforeEach } from 'vitest'
import { bibleStorage } from '../src/services/storage'

describe('Harpa storage bounds (1..640)', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {}
  })

  it('returns hymn 1 when nothing was saved', () => {
    expect(bibleStorage.getLastHymn()).toBe(1)
  })

  it('ignores out-of-range saved hymns and falls back to 1', () => {
    bibleStorage.setLastHymn(9999)
    expect(bibleStorage.getLastHymn()).toBe(1)
  })

  it('keeps a valid hymn', () => {
    bibleStorage.setLastHymn(500)
    expect(bibleStorage.getLastHymn()).toBe(500)
  })

  it('drops out-of-range favorites', () => {
    bibleStorage.addHymnFavorite(9999)
    bibleStorage.addHymnFavorite(12)
    expect(bibleStorage.getHymnFavorites()).toEqual([12])
  })
})
