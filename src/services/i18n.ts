import { useState, useEffect, useCallback, useMemo } from 'react'
import ptBR from '../../locales/pt-BR.json'
import enUS from '../../locales/en-US.json'
import es from '../../locales/es.json'
import fr from '../../locales/fr.json'
import de from '../../locales/de.json'
import it from '../../locales/it.json'

export const dictionaries = {
  'pt-BR': ptBR,
  'en-US': enUS,
  es,
  fr,
  de,
  it
} as const

export type SupportedLocale = keyof typeof dictionaries

const DEFAULT_LOCALE: SupportedLocale = 'pt-BR'

export function normalizeLocale(val?: string | null): SupportedLocale {
  if (!val) return DEFAULT_LOCALE
  if (val in dictionaries) return val as SupportedLocale
  const lower = val.toLowerCase()
  if (lower.startsWith('en')) return 'en-US'
  if (lower.startsWith('pt')) return 'pt-BR'
  if (lower.startsWith('es')) return 'es'
  if (lower.startsWith('fr')) return 'fr'
  if (lower.startsWith('de')) return 'de'
  if (lower.startsWith('it')) return 'it'
  return DEFAULT_LOCALE
}

export function getCurrentLocale(): SupportedLocale {
  if (typeof window !== 'undefined') {
    const win = window as any
    const sdkLocale = win.MomAISDK?.i18n?.getLocale?.()
    if (sdkLocale) return normalizeLocale(sdkLocale)
    if (win.__MOMAI_LOCALE__) return normalizeLocale(win.__MOMAI_LOCALE__)
    try {
      const saved = localStorage.getItem('momai_locale')
      if (saved) return normalizeLocale(saved)
    } catch {}
  }
  return DEFAULT_LOCALE
}

export function getTranslation(
  locale: SupportedLocale,
  path: string,
  vars?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE]
  const fallback = dictionaries[DEFAULT_LOCALE]

  const resolvePath = (obj: any, keys: string[]): string | undefined => {
    let curr = obj
    for (const k of keys) {
      if (!curr || typeof curr !== 'object') return undefined
      curr = curr[k]
    }
    return typeof curr === 'string' ? curr : undefined
  }

  const keys = path.split('.')
  let text = resolvePath(dict, keys) ?? resolvePath(fallback, keys) ?? path

  if (vars) {
    for (const [vKey, vVal] of Object.entries(vars)) {
      text = text.replaceAll(`{${vKey}}`, String(vVal))
    }
  }
  return text
}

export function getLocalizedBook(
  bookId: number,
  locale: SupportedLocale
): { name: string; abbrev: string } | undefined {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE]
  const books = (dict as any).books
  if (books && books[String(bookId)]) {
    return books[String(bookId)]
  }
  const fallbackBooks = (dictionaries[DEFAULT_LOCALE] as any).books
  return fallbackBooks?.[String(bookId)]
}

export function useBibleI18n(propLocale?: string) {
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    if (propLocale) return normalizeLocale(propLocale)
    return getCurrentLocale()
  })

  useEffect(() => {
    if (propLocale) {
      setLocale(normalizeLocale(propLocale))
    }
  }, [propLocale])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const win = window as any

    // 1. Listen via MomAISDK.i18n if available
    let unsubscribeSdk: (() => void) | undefined
    if (win.MomAISDK?.i18n?.onLocaleChange) {
      unsubscribeSdk = win.MomAISDK.i18n.onLocaleChange((newLocale: string) => {
        setLocale(normalizeLocale(newLocale))
      })
    }

    // 2. Listen via custom DOM event 'momai:locale-changed'
    const handleLocaleEvent = (e: any) => {
      const loc = e.detail?.locale || e.detail
      if (loc) setLocale(normalizeLocale(loc))
    }
    window.addEventListener('momai:locale-changed', handleLocaleEvent)

    // 3. Listen via storage event (cross-tab or direct localStorage updates)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'momai_locale' && e.newValue) {
        setLocale(normalizeLocale(e.newValue))
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      if (unsubscribeSdk) unsubscribeSdk()
      window.removeEventListener('momai:locale-changed', handleLocaleEvent)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      return getTranslation(locale, path, vars)
    },
    [locale]
  )

  const getBookName = useCallback(
    (bookId: number, fallbackName?: string) => {
      const b = getLocalizedBook(bookId, locale)
      return b ? b.name : fallbackName || ''
    },
    [locale]
  )

  const getBookAbbrev = useCallback(
    (bookId: number, fallbackAbbrev?: string) => {
      const b = getLocalizedBook(bookId, locale)
      return b ? b.abbrev : fallbackAbbrev || ''
    },
    [locale]
  )

  const getTestamentName = useCallback(
    (testament: 'AT' | 'NT') => {
      return getTranslation(locale, `testaments.${testament}`)
    },
    [locale]
  )

  return useMemo(
    () => ({
      locale,
      t,
      getBookName,
      getBookAbbrev,
      getTestamentName
    }),
    [locale, t, getBookName, getBookAbbrev, getTestamentName]
  )
}
