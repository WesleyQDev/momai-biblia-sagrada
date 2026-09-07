export type BibleLanguageId = 'pt-BR' | 'en-US' | 'es' | 'fr' | 'de' | 'it'

export interface BibleLanguage {
  id: BibleLanguageId
  label: string
  translationName: string
  translationShort: string
  file: string
}

export const BIBLE_LANGUAGE_EVENT = 'momai-biblia:language-changed'

export const DEFAULT_BIBLE_LANGUAGE_ID: BibleLanguageId = 'pt-BR'

export const BIBLE_LANGUAGES: readonly BibleLanguage[] = [
  {
    id: 'pt-BR',
    label: 'Português',
    translationName: 'Almeida Revista e Atualizada',
    translationShort: 'Almeida',
    file: 'almeida.json'
  },
  {
    id: 'en-US',
    label: 'English',
    translationName: 'King James Version',
    translationShort: 'KJV',
    file: 'kjv.json'
  },
  {
    id: 'es',
    label: 'Español',
    translationName: 'Reina-Valera 1909',
    translationShort: 'RV1909',
    file: 'rv1909.json'
  },
  {
    id: 'fr',
    label: 'Français',
    translationName: 'Louis Segond 1910',
    translationShort: 'LSG',
    file: 'lsg.json'
  },
  {
    id: 'de',
    label: 'Deutsch',
    translationName: 'Lutherbibel 1912',
    translationShort: 'LU1912',
    file: 'luth1912.json'
  },
  {
    id: 'it',
    label: 'Italiano',
    translationName: 'Riveduta 1927',
    translationShort: 'RIV',
    file: 'riveduta.json'
  }
]

export function isBibleLanguageId(value: unknown): value is BibleLanguageId {
  return BIBLE_LANGUAGES.some((lang) => lang.id === value)
}

export function getBibleLanguage(id: BibleLanguageId): BibleLanguage {
  const found = BIBLE_LANGUAGES.find((lang) => lang.id === id)
  if (!found) throw new Error(`Unknown Bible language: ${String(id)}`)
  return found
}

export function notifyBibleLanguageChanged(id: BibleLanguageId): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BIBLE_LANGUAGE_EVENT, { detail: id }))
}
