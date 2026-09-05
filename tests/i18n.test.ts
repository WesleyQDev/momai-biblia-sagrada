import { describe, it, expect } from 'vitest'
import {
  normalizeLocale,
  getTranslation,
  getLocalizedBook,
  dictionaries,
  SupportedLocale
} from '../src/services/i18n'

describe('Bible Extension i18n System', () => {
  const allLocales: SupportedLocale[] = ['pt-BR', 'en-US', 'es', 'fr', 'de', 'it']

  it('deve suportar todos os 6 idiomas oficiais da MomAI', () => {
    allLocales.forEach((loc) => {
      expect(dictionaries[loc]).toBeDefined()
      expect(dictionaries[loc].name).toBeTruthy()
      expect(dictionaries[loc].description).toBeTruthy()
      expect(dictionaries[loc].category).toBeTruthy()
    })
  })

  it('deve normalizar corretamente códigos de idioma', () => {
    expect(normalizeLocale('pt-BR')).toBe('pt-BR')
    expect(normalizeLocale('pt')).toBe('pt-BR')
    expect(normalizeLocale('en-US')).toBe('en-US')
    expect(normalizeLocale('en')).toBe('en-US')
    expect(normalizeLocale('es')).toBe('es')
    expect(normalizeLocale('es-ES')).toBe('es')
    expect(normalizeLocale('fr')).toBe('fr')
    expect(normalizeLocale('fr-FR')).toBe('fr')
    expect(normalizeLocale('de')).toBe('de')
    expect(normalizeLocale('it')).toBe('it')
    expect(normalizeLocale(null)).toBe('pt-BR')
    expect(normalizeLocale('unknown')).toBe('pt-BR')
  })

  it('deve traduzir chaves com e sem variáveis', () => {
    expect(getTranslation('pt-BR', 'home.title')).toBe('Bíblia Sagrada')
    expect(getTranslation('en-US', 'home.title')).toBe('Holy Bible')
    expect(getTranslation('es', 'home.title')).toBe('Santa Biblia')
    expect(getTranslation('fr', 'home.title')).toBe('Sainte Bible')
    expect(getTranslation('de', 'home.title')).toBe('Heilige Schrift')
    expect(getTranslation('it', 'home.title')).toBe('Sacra Bibbia')

    const interpolated = getTranslation('en-US', 'home.search_no_results', { query: 'love' })
    expect(interpolated).toBe('No verses found for "love"')
  })

  it('deve traduzir nomes dos livros da Bíblia nos 6 idiomas', () => {
    // Livro 1: Gênesis
    expect(getLocalizedBook(1, 'pt-BR')?.name).toBe('Gênesis')
    expect(getLocalizedBook(1, 'en-US')?.name).toBe('Genesis')
    expect(getLocalizedBook(1, 'es')?.name).toBe('Génesis')
    expect(getLocalizedBook(1, 'fr')?.name).toBe('Genèse')
    expect(getLocalizedBook(1, 'de')?.name).toBe('Genesis')
    expect(getLocalizedBook(1, 'it')?.name).toBe('Genesi')

    // Livro 40: Mateus
    expect(getLocalizedBook(40, 'pt-BR')?.name).toBe('Mateus')
    expect(getLocalizedBook(40, 'en-US')?.name).toBe('Matthew')
    expect(getLocalizedBook(40, 'es')?.name).toBe('Mateo')
    expect(getLocalizedBook(40, 'fr')?.name).toBe('Matthieu')
    expect(getLocalizedBook(40, 'de')?.name).toBe('Matthäus')
    expect(getLocalizedBook(40, 'it')?.name).toBe('Matteo')

    // Livro 66: Apocalipse
    expect(getLocalizedBook(66, 'pt-BR')?.name).toBe('Apocalipse')
    expect(getLocalizedBook(66, 'en-US')?.name).toBe('Revelation')
    expect(getLocalizedBook(66, 'es')?.name).toBe('Apocalipsis')
    expect(getLocalizedBook(66, 'fr')?.name).toBe('Apocalypse')
    expect(getLocalizedBook(66, 'de')?.name).toBe('Offenbarung')
    expect(getLocalizedBook(66, 'it')?.name).toBe('Apocalisse')
  })

  it('deve conter todos os 66 livros em cada um dos 6 idiomas', () => {
    allLocales.forEach((loc) => {
      for (let id = 1; id <= 66; id++) {
        const book = getLocalizedBook(id, loc)
        expect(book, `Livro ${id} faltando no idioma ${loc}`).toBeDefined()
        expect(book?.name).toBeTruthy()
        expect(book?.abbrev).toBeTruthy()
      }
    })
  })
})
