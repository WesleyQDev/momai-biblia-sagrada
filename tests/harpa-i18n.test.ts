import { describe, it, expect } from 'vitest'
import { dictionaries, getTranslation, type SupportedLocale } from '../src/services/i18n'

const locales: SupportedLocale[] = ['pt-BR', 'en-US', 'es', 'fr', 'de', 'it']

// Every key the Harpa Cristã screens read at runtime. Each locale must define
// all of them explicitly, otherwise a missing key silently falls back to pt-BR.
const harpaKeys = [
  'home.harpa',
  'home.harpa_hint',
  'harpa.title',
  'harpa.subtitle',
  'harpa.index_title',
  'harpa.search_placeholder',
  'harpa.search_no_results',
  'harpa.filter_all',
  'harpa.filter_favorites',
  'harpa.empty_favorites',
  'harpa.hymn_label',
  'harpa.stanza',
  'harpa.chorus',
  'harpa.copy',
  'harpa.copied',
  'harpa.bookmark',
  'harpa.unbookmark',
  'harpa.select_all',
  'harpa.original_note',
  'harpa.not_found',
  'harpa.total',
  'harpa.click_flip_next',
  'harpa.click_flip_prev',
  'harpa.click_flip_end',
  'harpa.click_flip_start'
]

function resolvePath(locale: SupportedLocale, path: string): unknown {
  let current: unknown = dictionaries[locale]
  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

describe('i18n da Harpa Cristã nos 6 idiomas', () => {
  it('deve definir todas as chaves da Harpa em cada idioma', () => {
    locales.forEach((locale) => {
      harpaKeys.forEach((key) => {
        const value = resolvePath(locale, key)
        expect(typeof value, `Chave ${key} ausente em ${locale}`).toBe('string')
        expect(String(value).trim(), `Chave ${key} vazia em ${locale}`).not.toBe('')
      })
    })
  })

  it('deve traduzir o botão da Harpa na tela inicial', () => {
    expect(getTranslation('pt-BR', 'home.harpa')).toBe('Harpa Cristã')
    expect(getTranslation('en-US', 'home.harpa')).toBe('Christian Harp')
    expect(getTranslation('es', 'home.harpa')).toBe('Arpa Cristiana')
    expect(getTranslation('fr', 'home.harpa')).toBe('Harpe Chrétienne')
    expect(getTranslation('de', 'home.harpa')).toBe('Christliche Harfe')
    expect(getTranslation('it', 'home.harpa')).toBe('Arpa Cristiana')
  })

  it('deve interpolar a contagem total de hinos', () => {
    const text = getTranslation('pt-BR', 'harpa.total', { count: 640 })
    expect(text).toContain('640')
    expect(text).not.toContain('{count}')
  })

  it('deve manter o nome do hinário traduzido e a nota do original em português', () => {
    locales.forEach((locale) => {
      const note = getTranslation(locale, 'harpa.original_note')
      expect(note.length).toBeGreaterThan(10)
    })
  })
})
