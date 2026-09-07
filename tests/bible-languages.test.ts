import { describe, it, expect, afterEach } from 'vitest'
import {
  BIBLE_LANGUAGES,
  DEFAULT_BIBLE_LANGUAGE_ID,
  getBibleLanguage,
  isBibleLanguageId,
  type BibleLanguageId
} from '../src/services/bible-languages'
import { bibleData } from '../src/services/bible-data'
import { bibleSearch } from '../src/services/search'
import { bibleStorage } from '../src/services/storage'
import { applyHostLocale, dictionaries, type SupportedLocale } from '../src/services/i18n'

describe('Registro de idiomas da Bíblia', () => {
  it('deve expor exatamente os 6 idiomas oficiais da MomAI', () => {
    const ids = BIBLE_LANGUAGES.map((lang) => lang.id)
    expect(ids).toEqual(['pt-BR', 'en-US', 'es', 'fr', 'de', 'it'])
  })

  it('deve ter rótulo, tradução e arquivo únicos por idioma', () => {
    const files = new Set(BIBLE_LANGUAGES.map((lang) => lang.file))
    const names = new Set(BIBLE_LANGUAGES.map((lang) => lang.translationName))
    expect(files.size).toBe(6)
    expect(names.size).toBe(6)
    for (const lang of BIBLE_LANGUAGES) {
      expect(lang.label).toBeTruthy()
      expect(lang.translationName).toBeTruthy()
      expect(lang.translationShort).toBeTruthy()
      expect(lang.file).toMatch(/\.json$/)
    }
  })

  it('deve mapear cada idioma para sua tradução evangélica principal', () => {
    expect(getBibleLanguage('pt-BR').translationShort).toBe('Almeida')
    expect(getBibleLanguage('en-US').translationShort).toBe('KJV')
    expect(getBibleLanguage('es').translationShort).toBe('RV1909')
    expect(getBibleLanguage('fr').translationShort).toBe('LSG')
    expect(getBibleLanguage('de').translationShort).toBe('LU1912')
    expect(getBibleLanguage('it').translationShort).toBe('RIV')
  })

  it('deve validar identificadores de idioma', () => {
    expect(isBibleLanguageId('pt-BR')).toBe(true)
    expect(isBibleLanguageId('en-US')).toBe(true)
    expect(isBibleLanguageId('xx')).toBe(false)
    expect(isBibleLanguageId(null)).toBe(false)
    expect(() => getBibleLanguage('xx' as BibleLanguageId)).toThrow()
  })

  it('deve iniciar em português (Almeida) com o cânon completo', () => {
    expect(DEFAULT_BIBLE_LANGUAGE_ID).toBe('pt-BR')
    expect(bibleData.getActiveLanguageId()).toBe('pt-BR')
    expect(bibleData.getAllBooks()).toHaveLength(66)
    const verse = bibleData.getVerse(43, 3, 16)!
    expect(verse.text).toContain('Deus amou o mundo')
  })

  it('deve persistir a escolha de idioma e ignorar valores inválidos', () => {
    bibleStorage.setBibleLanguageId('es')
    expect(bibleStorage.getBibleLanguageId()).toBe('es')
    bibleStorage.setBibleLanguageId('xx' as BibleLanguageId)
    expect(bibleStorage.getBibleLanguageId()).toBe('es')
    bibleStorage.setBibleLanguageId('pt-BR')
    expect(bibleStorage.getBibleLanguageId()).toBe('pt-BR')
  })

  it('deve conter as chaves do menu de idiomas nos 6 dicionários', () => {
    const allLocales: SupportedLocale[] = ['pt-BR', 'en-US', 'es', 'fr', 'de', 'it']
    for (const loc of allLocales) {
      const dict = dictionaries[loc] as any
      expect(dict.languages?.button, `languages.button em ${loc}`).toBeTruthy()
      expect(dict.languages?.title, `languages.title em ${loc}`).toBeTruthy()
      expect(dict.languages?.loading, `languages.loading em ${loc}`).toBeTruthy()
      expect(dict.languages?.load_error, `languages.load_error em ${loc}`).toBeTruthy()
    }
  })

  it('deve trocar de imediato para cada uma das 5 traduções bundladas', async () => {
    const cases: Array<{ id: BibleLanguageId; verseProbe: string; searchPhrase: string }> = [
      { id: 'en-US', verseProbe: 'For God so loved', searchPhrase: 'For God so loved the world' },
      { id: 'es', verseProbe: 'amó Dios', searchPhrase: 'Porque de tal manera amó Dios al mundo' },
      { id: 'fr', verseProbe: 'Car Dieu', searchPhrase: 'Car Dieu a tant aimé le monde' },
      { id: 'de', verseProbe: 'Also hat Gott', searchPhrase: 'Also hat Gott die Welt geliebt' },
      { id: 'it', verseProbe: 'ha tanto amato', searchPhrase: 'Poiché Iddio ha tanto amato il mondo' }
    ]
    try {
      for (const { id, verseProbe, searchPhrase } of cases) {
        await bibleData.loadBibleLanguage(id)
        expect(bibleData.getActiveLanguageId()).toBe(id)
        expect(bibleData.getAllBooks()).toHaveLength(66)
        expect(bibleData.getVerse(43, 3, 16)!.text).toContain(verseProbe)

        const results = bibleSearch.search(searchPhrase)
        expect(results.length).toBeGreaterThan(0)
        const found = results.find(
          (r) => r.verse.bookId === 43 && r.verse.chapter === 3 && r.verse.verse === 16
        )
        expect(found, `João 3:16 não encontrado na busca em ${id}`).toBeDefined()
        expect(found!.verse.text).toContain(verseProbe)
      }
    } finally {
      await bibleData.loadBibleLanguage('pt-BR')
    }
    expect(bibleData.getActiveLanguageId()).toBe('pt-BR')
    expect(bibleData.getVerse(43, 3, 16)!.text).toContain('Deus amou o mundo')
  })

  it('deve rejeitar idioma desconhecido sem trocar o texto ativo', async () => {
    await expect(bibleData.loadBibleLanguage('xx' as BibleLanguageId)).rejects.toThrow()
    expect(bibleData.getActiveLanguageId()).toBe('pt-BR')
  })

  it('deve seguir o idioma das Configurações de imediato (texto, rótulos e persistência)', () => {
    expect(applyHostLocale('en')).toBe('en-US')
    expect(bibleData.getActiveLanguageId()).toBe('en-US')
    expect(bibleStorage.getBibleLanguageId()).toBe('en-US')
    expect(bibleData.getVerse(43, 3, 16)!.text).toContain('For God so loved')

    expect(applyHostLocale('fr')).toBe('fr')
    expect(bibleData.getActiveLanguageId()).toBe('fr')
    expect(bibleStorage.getBibleLanguageId()).toBe('fr')

    expect(applyHostLocale('xx')).toBe('pt-BR')
    expect(applyHostLocale('pt-BR')).toBe('pt-BR')
    expect(bibleData.getActiveLanguageId()).toBe('pt-BR')
    expect(bibleStorage.getBibleLanguageId()).toBe('pt-BR')
  })

  afterEach(async () => {
    if (bibleData.getActiveLanguageId() !== 'pt-BR') {
      await bibleData.loadBibleLanguage('pt-BR')
    }
  })
})
