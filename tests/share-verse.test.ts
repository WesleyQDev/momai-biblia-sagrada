// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  BIBLE_SHARE_SOURCE,
  WHATSAPP_PAGE_PATH,
  WHATSAPP_SHARE_EVENT,
  WHATSAPP_SHARE_STORAGE_KEY,
  buildHymnShareText,
  buildVerseShareText,
  copyTextToClipboard,
  requestWhatsAppShare,
  shareHymn,
  shareVerse
} from '../src/services/share-verse'
import type { BibleVerse } from '../src/types/bible'
import type { HarpaHymn } from '../src/types/harpa'

beforeEach(() => {
  sessionStorage.clear()
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

describe('requestWhatsAppShare', () => {
  it('copies the verse, stores the pending share and opens the WhatsApp tab', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true
    })

    const seen: Array<{ type: string; detail: unknown }> = []
    const listener = (e: Event) => {
      seen.push({ type: e.type, detail: (e as CustomEvent).detail })
    }
    window.addEventListener(WHATSAPP_SHARE_EVENT, listener)
    window.addEventListener('momai_navigate', listener)
    window.addEventListener('momai_window_action', listener)

    const text = buildVerseShareText(mockVerse, 'John', 'KJV')
    requestWhatsAppShare(text)

    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(text)
    })

    const stored = JSON.parse(sessionStorage.getItem(WHATSAPP_SHARE_STORAGE_KEY)!)
    expect(stored).toMatchObject({ text, source: BIBLE_SHARE_SOURCE })
    expect(typeof stored.at).toBe('number')

    expect(seen).toContainEqual({
      type: WHATSAPP_SHARE_EVENT,
      detail: stored
    })
    expect(seen).toContainEqual({
      type: 'momai_navigate',
      detail: { path: WHATSAPP_PAGE_PATH }
    })
    expect(seen).toContainEqual({
      type: 'momai_window_action',
      detail: { action: 'restore' }
    })

    window.removeEventListener(WHATSAPP_SHARE_EVENT, listener)
    window.removeEventListener('momai_navigate', listener)
    window.removeEventListener('momai_window_action', listener)
  })

  it('still navigates when the clipboard write fails', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true
    })
    const navigateSpy = vi.fn()
    window.addEventListener('momai_navigate', navigateSpy)

    expect(() => requestWhatsAppShare('verse')).not.toThrow()
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(WHATSAPP_SHARE_STORAGE_KEY)).toContain('verse')

    window.removeEventListener('momai_navigate', navigateSpy)
  })
})

describe('shareVerse', () => {
  it('shares the formatted verse on the MomAI WhatsApp tab', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    })

    shareVerse(mockVerse, 'John', 'KJV')

    const stored = JSON.parse(sessionStorage.getItem(WHATSAPP_SHARE_STORAGE_KEY)!)
    expect(stored.text).toBe('"For God so loved the world." (John 3:16 - KJV)')
  })
})

describe('shareHymn', () => {
  it('shares the formatted hymn on the MomAI WhatsApp tab', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true
    })

    shareHymn(mockHymn)

    const stored = JSON.parse(sessionStorage.getItem(WHATSAPP_SHARE_STORAGE_KEY)!)
    expect(stored.text).toContain('Hino 1 - Chuvas de Graça')
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
