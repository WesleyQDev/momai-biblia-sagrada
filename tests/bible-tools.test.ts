import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createBibleTools, type BibleToolStorage } from '../lib/bible-tools'
import type { RawBibleBook } from '../src/types/bible'

const almeida = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../assets/bible/almeida.json'), 'utf8')
) as RawBibleBook[]

function memoryStorage(): BibleToolStorage & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>()
  return {
    data,
    async get(key) {
      return data.has(key) ? data.get(key) : null
    },
    async set(key, value) {
      data.set(key, value)
    }
  }
}

/** Minimal 66-book dataset so translation switching can be exercised. */
function fakeDataset(john316: string): RawBibleBook[] {
  return Array.from({ length: 66 }, (_, index) => ({
    id: index + 1,
    name: `Book ${index + 1}`,
    abbrev: `b${index + 1}`,
    testament: index + 1 <= 39 ? 'AT' : 'NT',
    totalChapters: 1,
    chapters: [[index + 1 === 43 ? john316 : `text ${index + 1}`]]
  }))
}

function makeTools(options: { books?: RawBibleBook[]; translationId?: string } = {}) {
  const storage = memoryStorage()
  const events: Array<{ type: string; data: Record<string, unknown> }> = []
  let translationId = options.translationId ?? 'pt-BR'
  let books = options.books ?? almeida
  const tools = createBibleTools({
    getBooks: async () => books,
    getTranslation: async () => ({
      id: translationId,
      name: translationId,
      short: translationId
    }),
    storage,
    emit: (type, data) => events.push({ type, data }),
    isValidLanguage: (id) => id === 'pt-BR' || id === 'en-US'
  })
  return {
    tools,
    storage,
    events,
    useTranslation: (id: string, dataset: RawBibleBook[]) => {
      translationId = id
      books = dataset
    }
  }
}

describe('Ferramentas do worker da Bíblia', () => {
  let ctx: ReturnType<typeof makeTools>

  beforeEach(() => {
    ctx = makeTools()
  })

  it('busca por referência exata e não devolve eco da consulta', async () => {
    const result = await ctx.tools.execute('search_bible', { query: 'João 3:16' })
    expect(result.ok).toBe(true)
    expect(result.total).toBe(1)
    const results = result.results as Array<Record<string, unknown>>
    expect(results[0].bookName).toBe('João')
    expect(results[0].chapter).toBe(3)
    expect(results[0].verse).toBe(16)
    expect(String(results[0].text)).toContain('Deus amou o mundo')
    expect(result).not.toHaveProperty('query')
    expect(result).not.toHaveProperty('directResponse')
    expect(result).not.toHaveProperty('instruction')
  })

  it('limita a quantidade de resultados a no máximo 50', async () => {
    const result = await ctx.tools.execute('search_bible', { query: 'amor', limit: 5000 })
    expect(result.ok).toBe(true)
    expect((result.results as unknown[]).length).toBeLessThanOrEqual(50)
  })

  it('obtém versículo e capítulo, rejeitando entradas inválidas', async () => {
    const verse = await ctx.tools.execute('get_verse', { book: 'jo', chapter: 3, verse: 16 })
    expect(verse.ok).toBe(true)
    expect(verse.reference).toBe('João 3:16')

    const chapter = await ctx.tools.execute('get_chapter', { book: 'Salmos', chapter: 23 })
    expect(chapter.ok).toBe(true)
    expect(chapter.totalVerses).toBe(6)

    const badBook = await ctx.tools.execute('get_verse', { book: 'Não Existe', chapter: 1, verse: 1 })
    expect(badBook.ok).toBe(false)

    const badChapter = await ctx.tools.execute('get_chapter', { book: 'Salmos', chapter: 999 })
    expect(badChapter.ok).toBe(false)

    const badType = await ctx.tools.execute('get_verse', { book: 'João', chapter: 'x', verse: 1 })
    expect(badType.ok).toBe(false)
  })

  it('sorteia versículo e emite o evento do versículo do dia', async () => {
    const result = await ctx.tools.execute('get_random_verse', { testament: 'NT' })
    expect(result.ok).toBe(true)
    expect(ctx.events.some((event) => event.type === 'bible_daily_verse')).toBe(true)
    const daily = ctx.events.find((event) => event.type === 'bible_daily_verse')!
    expect(daily.data.reference).toContain(':')
    expect(typeof daily.data.text).toBe('string')
  })

  it('adiciona, lista e remove marcadores com feedback real', async () => {
    const added = await ctx.tools.execute('add_bookmark', { book: 'João', chapter: 3, verse: 16, note: 'fé' })
    expect(added.ok).toBe(true)
    expect(added.created).toBe(true)
    expect(ctx.events.some((event) => event.type === 'bible_bookmark_created')).toBe(true)

    const duplicate = await ctx.tools.execute('add_bookmark', { book: 'João', chapter: 3, verse: 16 })
    expect(duplicate.ok).toBe(true)
    expect(duplicate.created).toBe(false)

    const listed = await ctx.tools.execute('list_bookmarks', {})
    expect(listed.total).toBe(1)

    const bookmark = (listed.bookmarks as Array<{ id: string }>)[0]
    const removed = await ctx.tools.execute('remove_bookmark', { id: bookmark.id })
    expect(removed.ok).toBe(true)
    expect(removed.removed).toBe(true)
    const removalEvent = ctx.events.find((event) => event.type === 'bible_bookmark_removed')!
    expect(removalEvent.data.reference).toBe('João 3:16')

    const again = await ctx.tools.execute('remove_bookmark', { id: bookmark.id })
    expect(again.ok).toBe(true)
    expect(again.removed).toBe(false)
    expect(ctx.events.filter((event) => event.type === 'bible_bookmark_removed').length).toBe(1)
  })

  it('registra o ponto de leitura e só emite progresso quando capítulo/livro muda', async () => {
    const first = await ctx.tools.execute('set_last_reading', { bookId: 43, chapter: 3, verse: 16 })
    expect(first.ok).toBe(true)
    expect(ctx.events.filter((event) => event.type === 'bible_reading_progress').length).toBe(1)

    const same = await ctx.tools.execute('set_last_reading', { bookId: 43, chapter: 3, verse: 5 })
    expect(same.ok).toBe(true)
    expect(ctx.events.filter((event) => event.type === 'bible_reading_progress').length).toBe(1)

    const next = await ctx.tools.execute('set_last_reading', { bookId: 43, chapter: 4, verse: 1 })
    expect(next.ok).toBe(true)
    expect(ctx.events.filter((event) => event.type === 'bible_reading_progress').length).toBe(2)

    const invalid = await ctx.tools.execute('set_last_reading', { bookId: 99, chapter: 1 })
    expect(invalid.ok).toBe(false)
  })

  it('retorna último ponto vazio quando não há leitura registrada', async () => {
    const result = await ctx.tools.execute('get_last_reading', {})
    expect(result.ok).toBe(true)
    expect(result.reading).toBeNull()
    expect(result.hasReading).toBe(false)
  })

  it('importa marcadores mesclando pelo mesmo versículo e mantendo o mais recente', async () => {
    const base = {
      bookId: 43,
      bookName: 'João',
      bookAbbrev: 'jo',
      testament: 'NT',
      chapter: 3,
      verse: 16,
      text: 'Porque Deus amou o mundo...',
      note: ''
    }
    const result = await ctx.tools.execute('import_bookmarks', {
      bookmarks: [
        { ...base, id: 'a', createdAt: 1 },
        { ...base, id: 'b', createdAt: 2 }
      ]
    })
    expect(result.ok).toBe(true)
    expect(result.total).toBe(1)
    const listed = await ctx.tools.execute('list_bookmarks', {})
    expect((listed.bookmarks as Array<{ id: string }>)[0].id).toBe('b')
  })

  it('registra o versículo do dia apresentado na interface', async () => {
    const result = await ctx.tools.execute('report_daily_verse', {
      reference: 'João 3:16',
      text: 'Porque Deus amou o mundo...',
      book: 'João',
      chapter: 3,
      verse: 16
    })
    expect(result.ok).toBe(true)
    expect(ctx.events.at(-1)?.type).toBe('bible_daily_verse')

    const missing = await ctx.tools.execute('report_daily_verse', { reference: '', text: '' })
    expect(missing.ok).toBe(false)
  })

  it('persiste o idioma ativo e rejeita idioma desconhecido', async () => {
    const ok = await ctx.tools.execute('set_active_language', { languageId: 'en-US' })
    expect(ok.ok).toBe(true)
    expect(ctx.storage.data.get('active-language')).toBe('en-US')

    const bad = await ctx.tools.execute('set_active_language', { languageId: 'xx' })
    expect(bad.ok).toBe(false)
    expect(ctx.storage.data.get('active-language')).toBe('en-US')
  })

  it('segue a tradução ativa selecionada pelo leitor', async () => {
    ctx.useTranslation('en-US', fakeDataset('For God so loved the world'))
    const result = await ctx.tools.execute('get_verse', { book: 'Book 43', chapter: 1, verse: 1 })
    expect(result.ok).toBe(true)
    expect(result.text).toBe('For God so loved the world')
    expect(result.translation).toBe('en-US')
  })

  it('responde erro claro para ferramenta desconhecida', async () => {
    const result = await ctx.tools.execute('nope', {})
    expect(result.ok).toBe(false)
    expect(String(result.error)).toContain('nope')
  })
})
