import type { BibleVerse } from '../types/bible'
import type { HarpaHymn } from '../types/harpa'

/**
 * Cross-extension share contract with momai-whatsapp. The host stays out of
 * it: biblia stores the verse as a pending share and asks the host (via the
 * same `momai_navigate` event the tracker widget uses) to open the WhatsApp
 * tab. The WhatsApp page consumes the pending share when the user selects a
 * contact and pre-fills the message composer. The clipboard copy remains as
 * a manual-paste fallback.
 */
export const WHATSAPP_PAGE_PATH = '/extensions/momai-whatsapp'
export const WHATSAPP_SHARE_STORAGE_KEY = 'momai_whatsapp_pending_share'
export const WHATSAPP_SHARE_EVENT = 'momai_whatsapp_share'
export const BIBLE_SHARE_SOURCE = 'momai-biblia-sagrada'

export interface WhatsAppSharePayload {
  text: string
  source: string
  at: number
}

/**
 * Formats a verse exactly like the reading-view copy action so the text
 * pasted into WhatsApp matches what the user already knows:
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
 * Copies the verse (manual-paste fallback), stores it as the pending WhatsApp
 * share and opens the MomAI WhatsApp tab, where selecting a contact pastes
 * the verse into the message input automatically.
 */
export function requestWhatsAppShare(text: string): void {
  void copyTextToClipboard(text).catch(() => {})

  const payload: WhatsAppSharePayload = {
    text,
    source: BIBLE_SHARE_SOURCE,
    at: Date.now()
  }
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(WHATSAPP_SHARE_STORAGE_KEY, JSON.stringify(payload))
    }
  } catch {
    // Sharing still works when the WhatsApp tab is already mounted: the
    // event below carries the same payload.
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WHATSAPP_SHARE_EVENT, { detail: payload }))
    window.dispatchEvent(
      new CustomEvent('momai_navigate', { detail: { path: WHATSAPP_PAGE_PATH } })
    )
    window.dispatchEvent(
      new CustomEvent('momai_window_action', { detail: { action: 'restore' } })
    )
  }
}

export function shareVerse(
  verse: BibleVerse,
  bookName: string,
  translationShort?: string
): void {
  requestWhatsAppShare(buildVerseShareText(verse, bookName, translationShort))
}

export function shareHymn(
  hymn: HarpaHymn,
  hymnLabel = 'Hino',
  chorusLabel = 'Coro'
): void {
  requestWhatsAppShare(buildHymnShareText(hymn, hymnLabel, chorusLabel))
}
