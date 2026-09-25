import { describe, it, expect } from 'vitest'
import { paginateHymns } from '../src/services/harpa-pagination'
import { harpaData } from '../src/services/harpa-data'

describe('Paginação da Harpa Cristã', () => {
  const hymns = harpaData.getAllHymns()

  it('deve incluir todos os 640 hinos em ordem, sem repetir nem perder nenhum', () => {
    const pages = paginateHymns(hymns, 2400)
    const numbers = pages.flatMap((page) => page.blocks.map((block) => block.hymnNumber))
    const unique = [...new Set(numbers)]

    expect(unique).toHaveLength(640)
    expect(unique).toEqual(hymns.map((h) => h.number))
  })

  it('nunca deve dividir um hino entre páginas diferentes', () => {
    const pages = paginateHymns(hymns, 2400)
    const pagesOfHymn = new Map<number, number[]>()

    pages.forEach((page, pageIdx) => {
      expect(page.blocks[0].type, `Página ${pageIdx + 1} não começa com um cabeçalho`).toBe(
        'hymn_head'
      )

      const pageHymns = new Set(page.blocks.map((block) => block.hymnNumber))
      pageHymns.forEach((number) => {
        const headIdx = page.blocks.findIndex(
          (block) => block.hymnNumber === number && block.type === 'hymn_head'
        )
        expect(
          headIdx,
          `Hino ${number} aparece na página ${pageIdx + 1} sem o próprio cabeçalho`
        ).toBeGreaterThanOrEqual(0)

        const hymnPages = pagesOfHymn.get(number) || []
        hymnPages.push(pageIdx + 1)
        pagesOfHymn.set(number, hymnPages)
      })
    })

    const splitHymns = [...pagesOfHymn.entries()].filter(([, hymnPages]) => hymnPages.length > 1)
    expect(splitHymns, `Hinos divididos entre páginas: ${JSON.stringify(splitHymns)}`).toHaveLength(0)
  })

  it('deve manter cada cabeçalho de hino com pelo menos a primeira estrofe', () => {
    const pages = paginateHymns(hymns, 2400)
    pages.forEach((page) => {
      const headIdx = page.blocks.findIndex((b) => b.type === 'hymn_head')
      expect(page.blocks[headIdx + 1].type).not.toBe('hymn_head')
    })
  })

  it('não deve produzir páginas vazias', () => {
    const pages = paginateHymns(hymns, 2400)
    expect(pages.length).toBeGreaterThan(0)
    pages.forEach((page) => {
      expect(page.blocks.length).toBeGreaterThan(0)
      expect(page.startHymn).toBeLessThanOrEqual(page.endHymn)
    })
  })

  it('deve colocar exatamente um hino por página em qualquer capacidade', () => {
    for (const capacity of [1200, 2400, 4000]) {
      const pages = paginateHymns(hymns, capacity)
      expect(pages).toHaveLength(640)
      pages.forEach((page, idx) => {
        const heads = page.blocks.filter((block) => block.type === 'hymn_head')
        expect(heads).toHaveLength(1)
        expect(heads[0].hymnNumber).toBe(idx + 1)
      })
    }
  })

  it('deve manter a numeração de página estável ao informar a página inicial', () => {
    const pages = paginateHymns(hymns, 2400, 5)
    expect(pages[0].pageNumber).toBe(5)
    expect(pages[1].pageNumber).toBe(6)
  })
})
