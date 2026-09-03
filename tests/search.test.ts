import { describe, it, expect } from 'vitest'
import { bibleSearch } from '../src/services/search'

describe('Motor de Busca da Bíblia', () => {
  it('deve localizar com precisão a referência "João 3:16"', () => {
    const results = bibleSearch.search('João 3:16')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].matchType).toBe('exact_reference')
    expect(results[0].verse.bookName).toBe('João')
    expect(results[0].verse.chapter).toBe(3)
    expect(results[0].verse.verse).toBe(16)
    expect(results[0].verse.text).toContain('Deus amou o mundo')
  })

  it('deve localizar referência com abreviação e sem acento "jo 3:16"', () => {
    const results = bibleSearch.search('jo 3:16')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].verse.bookName).toBe('João')
    expect(results[0].verse.chapter).toBe(3)
    expect(results[0].verse.verse).toBe(16)
  })

  it('deve localizar referência "Sl 23:1"', () => {
    const results = bibleSearch.search('Sl 23:1')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].verse.bookName).toBe('Salmos')
    expect(results[0].verse.chapter).toBe(23)
    expect(results[0].verse.verse).toBe(1)
    expect(results[0].verse.text).toContain('Senhor é o meu pastor')
  })

  it('deve localizar versículos por frase exata', () => {
    const results = bibleSearch.search('Deus amou o mundo')
    expect(results.length).toBeGreaterThan(0)
    const found = results.find((r) => r.verse.bookName === 'João' && r.verse.chapter === 3 && r.verse.verse === 16)
    expect(found).toBeDefined()
  })

  it('deve filtrar resultados por Testamento quando solicitado', () => {
    const results = bibleSearch.search('amor', { testament: 'NT', limit: 10 })
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.verse.testament).toBe('NT')
    })
  })
})
