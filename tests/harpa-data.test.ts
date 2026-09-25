import { describe, it, expect } from 'vitest'
import { harpaData } from '../src/services/harpa-data'

describe('Harpa Cristã (640 hinos)', () => {
  it('deve conter exatamente 640 hinos numerados de 1 a 640', () => {
    const hymns = harpaData.getAllHymns()
    expect(hymns).toHaveLength(640)
    expect(hymns[0].number).toBe(1)
    expect(hymns[639].number).toBe(640)
    hymns.forEach((hymn, idx) => {
      expect(hymn.number, `Hino fora de ordem no índice ${idx}`).toBe(idx + 1)
    })
  })

  it('deve possuir título e ao menos uma estrofe em cada hino', () => {
    harpaData.getAllHymns().forEach((hymn) => {
      expect(hymn.title.trim(), `Hino ${hymn.number} sem título`).not.toBe('')
      expect(hymn.stanzas.length, `Hino ${hymn.number} sem estrofes`).toBeGreaterThan(0)
      hymn.stanzas.forEach((stanza) => {
        expect(stanza.length, `Estrofe vazia no hino ${hymn.number}`).toBeGreaterThan(0)
        expect(stanza.join('').trim(), `Estrofe sem texto no hino ${hymn.number}`).not.toBe('')
      })
    })
  })

  it('deve abrir o hino 1 com título, coro e estrofes', () => {
    const hymn = harpaData.getHymn(1)
    expect(hymn).toBeDefined()
    expect(hymn!.title).toBe('Chuvas de Graça')
    expect(hymn!.stanzas).toHaveLength(4)
    expect(hymn!.stanzas[0][0]).toBe('Deus prometeu com certeza')
    expect(hymn!.chorus?.join(' ')).toContain('Chuvas pedimos, Senhor')
  })

  it('deve abrir o último hino da coleção', () => {
    const hymn = harpaData.getHymn(640)
    expect(hymn).toBeDefined()
    expect(hymn!.title).toMatch(/Proclamação da República/i)
  })

  it('deve retornar undefined para hinos fora de 1..640', () => {
    expect(harpaData.getHymn(0)).toBeUndefined()
    expect(harpaData.getHymn(641)).toBeUndefined()
    expect(harpaData.getHymn(12.5)).toBeUndefined()
  })

  it('deve navegar entre hinos respeitando os limites', () => {
    expect(harpaData.getNextHymn(1)!.number).toBe(2)
    expect(harpaData.getPrevHymn(2)!.number).toBe(1)
    expect(harpaData.getPrevHymn(1)).toBeUndefined()
    expect(harpaData.getNextHymn(640)).toBeUndefined()
  })

  it('deve pesquisar por número do hino', () => {
    const results = harpaData.search('545')
    expect(results[0].hymn.number).toBe(545)
    expect(results[0].matchType).toBe('number')
    expect(results[0].hymn.title).toMatch(/Porque Ele Vive/i)
  })

  it('deve pesquisar por título ignorando acentos e caixa', () => {
    const results = harpaData.search('chuvas de graca')
    expect(results[0].hymn.number).toBe(1)

    const accented = harpaData.search('PLENA PAZ')
    expect(accented[0].hymn.number).toBe(3)
  })

  it('deve pesquisar por trecho da letra e do coro', () => {
    const byLyric = harpaData.search('Deus prometeu com certeza')
    expect(byLyric[0].hymn.number).toBe(1)
    expect(byLyric[0].matchType).toBe('lyric')

    const byChorus = harpaData.search('Chuvas pedimos')
    expect(byChorus.some((r) => r.hymn.number === 1)).toBe(true)
  })

  it('deve respeitar o limite de resultados da pesquisa', () => {
    const results = harpaData.search('Jesus', { limit: 5 })
    expect(results.length).toBeLessThanOrEqual(5)
    expect(results.length).toBeGreaterThan(0)
  })

  it('deve retornar lista vazia para pesquisa vazia', () => {
    expect(harpaData.search('   ')).toHaveLength(0)
  })

  it('deve expor a fonte dos dados para atribuição', () => {
    expect(harpaData.getSource()).toContain('Harpa')
  })
})
