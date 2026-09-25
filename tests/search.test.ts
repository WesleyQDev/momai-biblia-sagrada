import { describe, it, expect } from 'vitest'
import { bibleSearch } from '../src/services/search'

describe('Motor de Busca da Bíblia e Harpa', () => {
  it('deve localizar com precisão a referência "João 3:16"', () => {
    const results = bibleSearch.search('João 3:16')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe('verse')
    expect(results[0].matchType).toBe('exact_reference')
    expect(results[0].verse?.bookName).toBe('João')
    expect(results[0].verse?.chapter).toBe(3)
    expect(results[0].verse?.verse).toBe(16)
    expect(results[0].verse?.text).toContain('Deus amou o mundo')
  })

  it('deve localizar referência com abreviação e sem acento "jo 3:16"', () => {
    const results = bibleSearch.search('jo 3:16')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].verse?.bookName).toBe('João')
    expect(results[0].verse?.chapter).toBe(3)
    expect(results[0].verse?.verse).toBe(16)
  })

  it('deve localizar referência "Sl 23:1"', () => {
    const results = bibleSearch.search('Sl 23:1')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].verse?.bookName).toBe('Salmos')
    expect(results[0].verse?.chapter).toBe(23)
    expect(results[0].verse?.verse).toBe(1)
    expect(results[0].verse?.text).toContain('Senhor é o meu pastor')
  })

  it('deve localizar versículos por frase exata', () => {
    const results = bibleSearch.search('Deus amou o mundo')
    expect(results.length).toBeGreaterThan(0)
    const found = results.find((r) => r.verse?.bookName === 'João' && r.verse?.chapter === 3 && r.verse?.verse === 16)
    expect(found).toBeDefined()
  })

  it('deve filtrar resultados por Testamento quando solicitado', () => {
    const results = bibleSearch.search('amor', { testament: 'NT', limit: 10 })
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.type).toBe('verse')
      expect(r.verse?.testament).toBe('NT')
    })
  })

  it('deve localizar hino da Harpa Cristã por número exato ("545")', () => {
    const results = bibleSearch.search('545')
    expect(results.length).toBeGreaterThan(0)
    const top = results[0]
    expect(top.type).toBe('hymn')
    expect(top.hymn?.number).toBe(545)
    expect(top.hymn?.title).toMatch(/Porque Ele Vive/i)
    expect(top.matchType).toBe('hymn_number')
    expect(top.snippet).toBeDefined()
  })

  it('deve localizar hino da Harpa com prefixo ("hino 545" e "harpa 1")', () => {
    const r1 = bibleSearch.search('hino 545')
    expect(r1.length).toBeGreaterThan(0)
    expect(r1[0].type).toBe('hymn')
    expect(r1[0].hymn?.number).toBe(545)

    const r2 = bibleSearch.search('harpa 1')
    expect(r2.length).toBeGreaterThan(0)
    expect(r2[0].type).toBe('hymn')
    expect(r2[0].hymn?.number).toBe(1)
  })

  it('deve localizar hino da Harpa por título ("Porque Ele Vive")', () => {
    const results = bibleSearch.search('Porque Ele Vive')
    expect(results.length).toBeGreaterThan(0)
    const hymn = results.find((r) => r.type === 'hymn' && r.hymn?.number === 545)
    expect(hymn).toBeDefined()
    expect(hymn?.matchType).toBe('hymn_title')
  })

  it('deve localizar hino da Harpa por trecho da letra ou coro', () => {
    const results = bibleSearch.search('Chuvas pedimos Senhor')
    expect(results.length).toBeGreaterThan(0)
    const hymn1 = results.find((r) => r.type === 'hymn' && r.hymn?.number === 1)
    expect(hymn1).toBeDefined()
  })

  it('deve filtrar busca para apenas Harpa quando scope for "HARPA"', () => {
    const results = bibleSearch.search('amor', { scope: 'HARPA', limit: 10 })
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.type).toBe('hymn')
      expect(r.hymn).toBeDefined()
      expect(r.verse).toBeUndefined()
    })
  })

  it('deve filtrar busca para apenas Antigo Testamento quando scope for "AT"', () => {
    const results = bibleSearch.search('amor', { scope: 'AT', limit: 10 })
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.type).toBe('verse')
      expect(r.verse?.testament).toBe('AT')
    })
  })

  it('deve retornar busca combinada (versículos e hinos) quando scope for "ALL", com versículos primeiro e hinos depois', () => {
    const results = bibleSearch.search('paz', { scope: 'ALL', limit: 20 })
    expect(results.length).toBeGreaterThan(0)
    const hasVerse = results.some((r) => r.type === 'verse')
    const hasHymn = results.some((r) => r.type === 'hymn')
    expect(hasVerse).toBe(true)
    expect(hasHymn).toBe(true)

    // Versículos devem aparecer primeiro e hinos depois
    const firstHymnIdx = results.findIndex((r) => r.type === 'hymn')
    const lastVerseIdx = results.map((r) => r.type).lastIndexOf('verse')
    expect(firstHymnIdx).toBeGreaterThan(lastVerseIdx)
    expect(results[0].type).toBe('verse')
  })

  it('deve incluir o hino 467 ("Sobre as Ondas do Mar") ao pesquisar "cabo" em Todos, posicionado após os versículos', () => {
    const results = bibleSearch.search('cabo', { scope: 'ALL', limit: 16 })
    const hymn = results.find((r) => r.type === 'hymn' && r.hymn?.number === 467)
    expect(hymn).toBeDefined()

    // O primeiro resultado deve ser versículo
    expect(results[0].type).toBe('verse')
    const hymnIdx = results.findIndex((r) => r.type === 'hymn' && r.hymn?.number === 467)
    const firstVerseIdx = results.findIndex((r) => r.type === 'verse')
    expect(hymnIdx).toBeGreaterThan(firstVerseIdx)
  })
})
