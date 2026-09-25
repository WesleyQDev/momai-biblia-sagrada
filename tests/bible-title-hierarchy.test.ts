import { describe, it, expect } from 'vitest'
import { getBookTitleHierarchy } from '../src/services/bible-title-hierarchy'

describe('Bible Book Title Hierarchy', () => {
  it('formats Genesis with Pentateuch subtitle', () => {
    const info = getBookTitleHierarchy('pt-BR', 1, 'Gênesis')
    expect(info.subtitle).toBe('PRIMEIRO LIVRO DE MOISÉS')
    expect(info.title).toBe('GÊNESIS')
  })

  it('formats the 4 Gospels with "O EVANGELHO SEGUNDO" subtitle', () => {
    const matthew = getBookTitleHierarchy('pt-BR', 40, 'Mateus')
    expect(matthew.subtitle).toBe('O EVANGELHO SEGUNDO')
    expect(matthew.title).toBe('SÃO MATEUS')

    const mark = getBookTitleHierarchy('pt-BR', 41, 'Marcos')
    expect(mark.subtitle).toBe('O EVANGELHO SEGUNDO')
    expect(mark.title).toBe('SÃO MARCOS')

    const luke = getBookTitleHierarchy('pt-BR', 42, 'Lucas')
    expect(luke.subtitle).toBe('O EVANGELHO SEGUNDO')
    expect(luke.title).toBe('SÃO LUCAS')

    const john = getBookTitleHierarchy('pt-BR', 43, 'João')
    expect(john.subtitle).toBe('O EVANGELHO SEGUNDO')
    expect(john.title).toBe('SÃO JOÃO')
  })

  it('formats Pauline epistles and general letters with appropriate subtitles', () => {
    const romans = getBookTitleHierarchy('pt-BR', 45, 'Romanos')
    expect(romans.subtitle).toBe('EPÍSTOLA DE PAULO AOS')
    expect(romans.title).toBe('ROMANOS')

    const cor1 = getBookTitleHierarchy('pt-BR', 46, '1 Coríntios')
    expect(cor1.subtitle).toBe('PRIMEIRA EPÍSTOLA DE PAULO AOS')
    expect(cor1.title).toBe('CORÍNTIOS')

    const cor2 = getBookTitleHierarchy('pt-BR', 47, '2 Coríntios')
    expect(cor2.subtitle).toBe('SEGUNDA EPÍSTOLA DE PAULO AOS')
    expect(cor2.title).toBe('CORÍNTIOS')

    const james = getBookTitleHierarchy('pt-BR', 59, 'Tiago')
    expect(james.subtitle).toBe('EPÍSTOLA UNIVERSAL DE')
    expect(james.title).toBe('SÃO TIAGO')

    const peter1 = getBookTitleHierarchy('pt-BR', 60, '1 Pedro')
    expect(peter1.subtitle).toBe('PRIMEIRA EPÍSTOLA UNIVERSAL DE')
    expect(peter1.title).toBe('SÃO PEDRO')
  })

  it('formats Revelation and Acts correctly', () => {
    const acts = getBookTitleHierarchy('pt-BR', 44, 'Atos')
    expect(acts.subtitle).toBe('O LIVRO DE')
    expect(acts.title).toBe('ATOS DOS APÓSTOLOS')

    const rev = getBookTitleHierarchy('pt-BR', 66, 'Apocalipse')
    expect(rev.subtitle).toBe('A REVELAÇÃO DE JESUS CRISTO')
    expect(rev.title).toBe('APOCALIPSE')
  })

  it('supports English and Spanish translations', () => {
    const matthewEn = getBookTitleHierarchy('en-US', 40, 'Matthew')
    expect(matthewEn.subtitle).toBe('THE GOSPEL ACCORDING TO')
    expect(matthewEn.title).toBe('SAINT MATTHEW')

    const genesisEs = getBookTitleHierarchy('es', 1, 'Génesis')
    expect(genesisEs.subtitle).toBe('EL PRIMER LIBRO DE MOISÉS')
    expect(genesisEs.title).toBe('GÉNESIS')
  })
})
