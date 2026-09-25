import { describe, it, expect, afterEach } from 'vitest'
import { harpaData } from '../src/services/harpa-data'
import { bibleData } from '../src/services/bible-data'
import { applyHostLocale } from '../src/services/i18n'

const locales = ['en-US', 'es', 'fr', 'de', 'it'] as const

describe('Harpa Cristã multilíngue (título, estrofes e coro)', () => {
  afterEach(async () => {
    await harpaData.loadHarpaLanguage('pt-BR')
    if (bibleData.getActiveLanguageId() !== 'pt-BR') {
      await bibleData.loadBibleLanguage('pt-BR')
    }
  })

  it('mantém o português como original e fallback', async () => {
    await harpaData.loadHarpaLanguage('pt-BR')
    const hymn = harpaData.getHymn(1)!
    expect(hymn.title).toBe('Chuvas de Graça')
    expect(hymn.stanzas[0][0]).toBe('Deus prometeu com certeza')

    const original = harpaData.getOriginalHymn(1)!
    expect(original.title).toBe('Chuvas de Graça')
  })

  it('exibe título, estrofes e coro no idioma selecionado', async () => {
    await harpaData.loadHarpaLanguage('en-US')
    expect(harpaData.getActiveLanguageId()).toBe('en-US')
    const hymn = harpaData.getHymn(1)!
    expect(hymn.title).not.toBe('Chuvas de Graça')
    expect(hymn.title.trim()).not.toBe('')
    expect(hymn.stanzas.length).toBeGreaterThan(0)
    expect(hymn.stanzas[0].join(' ').trim()).not.toBe('')
    expect(hymn.chorus?.join(' ').trim()).not.toBe('')

    // O original em português segue acessível
    const original = harpaData.getOriginalHymn(1)!
    expect(original.title).toBe('Chuvas de Graça')
  })

  it('traduz o hino 545 em cada idioma com fallback por campo', async () => {
    for (const locale of locales) {
      await harpaData.loadHarpaLanguage(locale)
      const hymn = harpaData.getHymn(545)!
      expect(hymn.title.trim(), `título ausente em ${locale}`).not.toBe('')
      expect(hymn.stanzas.length, `estrofes ausentes em ${locale}`).toBeGreaterThan(0)
      // Todo hino traduzido ou com fallback possui ao menos um verso
      hymn.stanzas.forEach((stanza) => {
        expect(stanza.join('').trim()).not.toBe('')
      })
    }
  })

  it('cai para o português hino a hino quando falta tradução', async () => {
    await harpaData.loadHarpaLanguage('en-US')
    // Hinos sem overlay traduzido mantêm o texto original
    expect(harpaData.isHymnTranslated(1)).toBe(true)
    const fallback = harpaData.getHymn(2)!
    const original = harpaData.getOriginalHymn(2)!
    if (!harpaData.isHymnTranslated(2)) {
      expect(fallback.title).toBe(original.title)
      expect(fallback.stanzas).toEqual(original.stanzas)
    }
  })

  it('traduz os hinos 11 e 12 em inglês (caso reportado)', async () => {
    await harpaData.loadHarpaLanguage('en-US')
    const hymn11 = harpaData.getHymn(11)!
    expect(hymn11.title).not.toBe('Ó Cristão, Eia Avante')
    expect(hymn11.title.trim()).not.toBe('')
    expect(hymn11.stanzas.flat().join(' ').trim()).not.toBe('')
    expect((hymn11.chorus ?? []).join(' ').trim()).not.toBe('')

    const hymn12 = harpaData.getHymn(12)!
    expect(hymn12.title).not.toBe('Vem Já, Pecador')
    expect(hymn12.title.trim()).not.toBe('')
    expect(hymn12.stanzas.flat().join(' ').trim()).not.toBe('')
    expect((hymn12.chorus ?? []).join(' ').trim()).not.toBe('')
  })

  it('cobre os 640 hinos em cada idioma com fallback para o português', async () => {
    for (const locale of locales) {
      await harpaData.loadHarpaLanguage(locale)
      const hymns = harpaData.getAllHymns()
      expect(hymns).toHaveLength(640)
      let translatedCount = 0
      for (const hymn of hymns) {
        expect(hymn.title.trim(), `título vazio no hino ${hymn.number} em ${locale}`).not.toBe('')
        expect(
          hymn.stanzas.length,
          `sem estrofes no hino ${hymn.number} em ${locale}`
        ).toBeGreaterThan(0)
        if (harpaData.isHymnTranslated(hymn.number)) {
          translatedCount += 1
        } else {
          const original = harpaData.getOriginalHymn(hymn.number)!
          expect(hymn.title, `fallback quebrou no hino ${hymn.number} em ${locale}`).toBe(
            original.title
          )
        }
      }
      expect(translatedCount, `poucos hinos traduzidos em ${locale}`).toBeGreaterThan(0)
    }
  })

  it('mantém 640 hinos e navegação em qualquer idioma', async () => {
    for (const locale of locales) {
      await harpaData.loadHarpaLanguage(locale)
      expect(harpaData.getAllHymns()).toHaveLength(640)
      expect(harpaData.getHymn(1)?.number).toBe(1)
      expect(harpaData.getHymn(640)?.number).toBe(640)
      expect(harpaData.getNextHymn(1)?.number).toBe(2)
      expect(harpaData.getPrevHymn(1)).toBeUndefined()
    }
  })

  it('pesquisa no idioma ativo com índice reconstruído', async () => {
    await harpaData.loadHarpaLanguage('en-US')
    const results = harpaData.search(harpaData.getHymn(1)!.title)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.hymn.number === 1)).toBe(true)

    await harpaData.loadHarpaLanguage('pt-BR')
    const ptResults = harpaData.search('Chuvas de Graça')
    expect(ptResults[0]?.hymn.number).toBe(1)
  })

  it('acompanha o idioma das Configurações/boas-vindas automaticamente', () => {
    expect(applyHostLocale('en')).toBe('en-US')
    expect(harpaData.getActiveLanguageId()).toBe('en-US')
    expect(harpaData.getHymn(1)!.title).not.toBe('Chuvas de Graça')

    expect(applyHostLocale('pt-BR')).toBe('pt-BR')
    expect(harpaData.getActiveLanguageId()).toBe('pt-BR')
    expect(harpaData.getHymn(1)!.title).toBe('Chuvas de Graça')
  })

  it('rejeita idioma desconhecido sem trocar o texto ativo', async () => {
    await harpaData.loadHarpaLanguage('en-US')
    await expect(harpaData.loadHarpaLanguage('xx' as never)).rejects.toThrow()
    expect(harpaData.getActiveLanguageId()).toBe('en-US')
  })
})
