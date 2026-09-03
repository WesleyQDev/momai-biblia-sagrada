import { describe, it, expect } from 'vitest'
import { bibleData } from '../src/services/bible-data'

describe('Cânon Bíblico Protestante (66 Livros)', () => {
  it('deve conter exatamente 66 livros', () => {
    const allBooks = bibleData.getAllBooks()
    expect(allBooks).toHaveLength(66)
  })

  it('deve possuir 39 livros no Antigo Testamento (Gênesis a Malaquias)', () => {
    const at = bibleData.getOldTestamentBooks()
    expect(at).toHaveLength(39)
    expect(at[0].name).toBe('Gênesis')
    expect(at[at.length - 1].name).toBe('Malaquias')
  })

  it('deve possuir 27 livros no Novo Testamento (Mateus a Apocalipse)', () => {
    const nt = bibleData.getNewTestamentBooks()
    expect(nt).toHaveLength(27)
    expect(nt[0].name).toBe('Mateus')
    expect(nt[nt.length - 1].name).toBe('Apocalipse')
  })

  it('deve transicionar perfeitamente de Malaquias (último do AT) para Mateus (primeiro do NT)', () => {
    const malachi = bibleData.findBook('Malaquias')!
    expect(malachi.id).toBe(39)

    const next = bibleData.getNextChapter(malachi.id, malachi.totalChapters)
    expect(next).toEqual({ bookId: 40, chapter: 1 })

    const matthew = bibleData.getBookById(next!.bookId)!
    expect(matthew.name).toBe('Mateus')
  })

  it('deve transicionar de Mateus 1 de volta para o último capítulo de Malaquias', () => {
    const matthew = bibleData.findBook('Mateus')!
    expect(matthew.id).toBe(40)

    const prev = bibleData.getPrevChapter(matthew.id, 1)
    expect(prev).toEqual({ bookId: 39, chapter: 4 })
  })

  it('deve retornar null ao tentar ir antes de Gênesis 1', () => {
    const prev = bibleData.getPrevChapter(1, 1)
    expect(prev).toBeNull()
  })

  it('deve retornar null ao tentar avançar após Apocalipse 22', () => {
    const revelation = bibleData.findBook('Apocalipse')!
    expect(revelation.id).toBe(66)
    expect(revelation.totalChapters).toBe(22)

    const next = bibleData.getNextChapter(revelation.id, 22)
    expect(next).toBeNull()
  })
})
