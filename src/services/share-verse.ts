import type { BibleVerse } from '../types/bible'
import type { HarpaHymn } from '../types/harpa'
import sdk from 'momai:sdk'

export const BIBLE_SHARE_SOURCE = 'momai-biblia-sagrada'

export interface ShareContentPayload {
  title?: string
  text: string
  url?: string
}

/**
 * Formats a verse exactly like the reading-view copy action so the text
 * shared or copied matches what the user already knows:
 * "text" (Book chapter:verse - Translation).
 */
export function buildVerseShareText(
  verse: BibleVerse,
  bookName: string,
  translationShort?: string
): string {
  const suffix = translationShort ? ` - ${translationShort}` : ''
  return `"${verse.text}" (${bookName} ${verse.chapter}:${verse.verse}${suffix})`
}

/**
 * Formats a Christian Harp hymn with stanzas and chorus for sharing.
 */
export function buildHymnShareText(
  hymn: HarpaHymn,
  hymnLabel = 'Hino',
  chorusLabel = 'Coro'
): string {
  const lines: string[] = [`${hymnLabel} ${hymn.number} - ${hymn.title}`]
  hymn.stanzas.forEach((stanza, index) => {
    const text = Array.isArray(stanza) ? stanza.join('\n') : String(stanza)
    lines.push('', `${index + 1}. ${text}`)
  })
  if (hymn.chorus) {
    const chorusText = Array.isArray(hymn.chorus) ? hymn.chorus.join('\n') : String(hymn.chorus)
    lines.push('', `${chorusLabel}:\n${chorusText}`)
  }
  return lines.join('\n')
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy textarea fallback below.
  }

  try {
    if (typeof document === 'undefined') return false
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/**
 * Uses MomAI SDK's share modal system to share content across available
 * providers (e.g. WhatsApp, Email, or clipboard copy). Falls back to
 * direct clipboard copy if the SDK share module is not available.
 */
export async function requestShare(
  payload: ShareContentPayload | string
): Promise<boolean> {
  const sharePayload: ShareContentPayload =
    typeof payload === 'string' ? { text: payload } : payload

  try {
    const shareApi =
      (sdk as any)?.share ||
      (typeof window !== 'undefined' && (window as any).MomAISDK?.share)

    if (shareApi && typeof shareApi.open === 'function') {
      const res = await shareApi.open(sharePayload)
      return res?.ok ?? true
    }
  } catch (err) {
    console.warn('[share-verse] SDK share failed, falling back to clipboard', err)
  }

  return copyTextToClipboard(sharePayload.text)
}

/**
 * @deprecated Use requestShare instead. Kept for backwards compatibility.
 */
export function requestWhatsAppShare(text: string): Promise<boolean> {
  return requestShare(text)
}

export function shareVerse(
  verse: BibleVerse,
  bookName: string,
  translationShort?: string
): Promise<boolean> {
  const suffix = translationShort ? ` (${translationShort})` : ''
  const title = `${bookName} ${verse.chapter}:${verse.verse}${suffix}`
  const text = buildVerseShareText(verse, bookName, translationShort)
  return requestShare({ title, text })
}

export function shareHymn(
  hymn: HarpaHymn,
  hymnLabel = 'Hino',
  chorusLabel = 'Coro'
): Promise<boolean> {
  const title = `${hymnLabel} ${hymn.number} - ${hymn.title}`
  const text = buildHymnShareText(hymn, hymnLabel, chorusLabel)
  return requestShare({ title, text })
}
