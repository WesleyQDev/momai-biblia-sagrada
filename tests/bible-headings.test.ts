import { describe, it, expect } from 'vitest'
import { bibleHeadings } from '../src/services/bible-headings'

describe('bibleHeadings', () => {
  it('loads 3ª Edição 2017 (SBB) Portuguese headings for Matthew 2 correctly', () => {
    // Matthew is Book 40
    expect(bibleHeadings.getHeading('pt-BR', 40, 2, 1)).toBe('A visita dos magos')
    expect(bibleHeadings.getHeading('pt-BR', 40, 2, 13)).toBe('A fuga para o Egito')
    expect(bibleHeadings.getHeading('pt-BR', 40, 2, 16)).toBe('A matança dos meninos de Belém')
    expect(bibleHeadings.getHeading('pt-BR', 40, 2, 19)).toBe('A volta do Egito')
  })

  it('loads English headings for Matthew 2 correctly', () => {
    expect(bibleHeadings.getHeading('en-US', 40, 2, 1)).toBe('The Visit of the Wise Men')
    expect(bibleHeadings.getHeading('en-US', 40, 2, 13)).toBe('The Flight to Egypt')
    expect(bibleHeadings.getHeading('en-US', 40, 2, 16)).toBe('Herod Kills the Children')
    expect(bibleHeadings.getHeading('en-US', 40, 2, 19)).toBe('The Return to Nazareth')
  })

  it('loads Spanish headings for Matthew 2 correctly', () => {
    expect(bibleHeadings.getHeading('es', 40, 2, 1)).toBe('La visita de los magos')
    expect(bibleHeadings.getHeading('es', 40, 2, 13)).toBe('La huida a Egipto')
  })

  it('loads French, German, and Italian headings for Genesis 1', () => {
    // Genesis is Book 1
    expect(bibleHeadings.getHeading('fr', 1, 1, 1)).toBe('La création du ciel et de la terre')
    expect(bibleHeadings.getHeading('de', 1, 1, 1)).toBe('Die Schöpfung')
    expect(bibleHeadings.getHeading('it', 1, 1, 1)).toBe('La creazione del mondo')
  })

  it('retrieves all headings for a chapter as a map', () => {
    const mt2Headings = bibleHeadings.getChapterHeadings('pt-BR', 40, 2)
    expect(mt2Headings.size).toBe(4)
    expect(mt2Headings.get(1)).toBe('A visita dos magos')
    expect(mt2Headings.get(13)).toBe('A fuga para o Egito')
    expect(mt2Headings.get(16)).toBe('A matança dos meninos de Belém')
    expect(mt2Headings.get(19)).toBe('A volta do Egito')
  })
})
