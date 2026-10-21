// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import sdk from 'momai:sdk'
import {
  BIBLE_SHARE_SOURCE,
  buildHymnShareText,
  buildVerseShareText,
  copyTextToClipboard,
  requestShare,
  requestWhatsAppShare,
  shareHymn,
  shareVerse
} from '../src/services/share-verse'
import type { BibleVerse } from '../src/types/bible'
import type { HarpaHymn } from '../src/types/harpa'

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const mockVerse: BibleVerse = {
  id: 'jo-3-16',
  bookId: 43,
  bookName: 'John',
  bookAbbrev: 'jo',
  testament: 'NT',
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world.'
}

const mockHymn: HarpaHymn = {
  number: 1,
  title: 'Chuvas de Graça',
  author: 'Harpa Cristã',
  stanzas: ['Deus prometeu com certeza', 'Chuvas de graça teremos'],
  chorus: 'Chuvas de graça'
}

describe('buildVerseShareText', () => {
  it('formats verse with book, reference and translation', () => {
    expect(buildVerseShareText(mockVerse, 'John', 'KJV')).toBe(
      '"For God so loved the world." (John 3:16 - KJV)'
    )
  })

  it('omits the translation suffix when it is missing', () => {
    expect(buildVerseShareText(mockVerse, 'John')).toBe(
      '"For God so loved the world." (John 3:16)'
    )
  })
})

describe('buildHymnShareText', () => {
  it('formats hymn with number, title, stanzas and chorus', () => {
    const text = buildHymnShareText(mockHymn)
    expect(text).toContain('Hino 1 - Chuvas de Graça')
    expect(text).toContain('1. Deus prometeu com certeza')
    expect(text).toContain('Coro:\nChuvas de graça')
    expect(text).toContain('2. Chuvas de graça teremos')
  })
})

describe('requestShare', () => {
  it('calls sdk.share.open with the provided payload', async () => {
    const payload = {
      title: 'John 3:16',
      text: '"For God so loved the world." (John 3:16)'
    }

    const res = await requestShare(payload)
    expect(res).toBe(true)
    expect(sdk.share.open).toHaveBeenCalledWith(payload)
  })

  it('accepts a string payload and wraps it as text', async () => {
    const text = 'Simple share text'
    await requestShare(text)
    expect(sdk.share.open).toHaveBeenCalledWith({ text })
  })

  it('falls back to clipboard if sdk.share.open rejects or fails', async () => {
    vi.mocked(sdk.share.open).mockRejectedValueOnce(new Error('SDK error'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })

    const res = await requestShare('Fallback text')
    expect(res).toBe(true)
    expect(writeText).toHaveBeenCalledWith('Fallback text')
  })
})

describe('requestWhatsAppShare (legacy alias)', () => {
  it('delegates to requestShare for backwards compatibility', async () => {
    const text = 'Shared text'
    await requestWhatsAppShare(text)
    expect(sdk.share.open).toHaveBeenCalledWith({ text })
  })
})

describe('shareVerse', () => {
  it('formats and opens SDK share with book reference title and verse text', async () => {
    await shareVerse(mockVerse, 'John', 'KJV')

    expect(sdk.share.open).toHaveBeenCalledWith({
      title: 'John 3:16 (KJV)',
      text: '"For God so loved the world." (John 3:16 - KJV)'
    })
  })
})

describe('shareHymn', () => {
  it('formats and opens SDK share with hymn title and stanzas text', async () => {
    await shareHymn(mockHymn)

    expect(sdk.share.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Hino 1 - Chuvas de Graça',
        text: expect.stringContaining('Chuvas de Graça')
      })
    )
  })
})

describe('copyTextToClipboard', () => {
  it('returns false when the clipboard API is unavailable and the fallback fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    })
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true
    })
    await expect(copyTextToClipboard('verse')).resolves.toBe(false)
  })
})
