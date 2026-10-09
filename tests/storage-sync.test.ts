// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../src/services/worker-bridge', () => ({
  hasWorkerBridge: () => true,
  executeBibleTool: vi.fn()
}))

import { bibleStorage } from '../src/services/storage'
import { executeBibleTool } from '../src/services/worker-bridge'

const mockedTool = vi.mocked(executeBibleTool)

function bookmark(overrides: Record<string, unknown> = {}) {
  return {
    id: 'jo-3-16-1',
    bookId: 43,
    bookName: 'João',
    bookAbbrev: 'jo',
    testament: 'NT',
    chapter: 3,
    verse: 16,
    text: 'Porque Deus amou o mundo...',
    createdAt: 1,
    ...overrides
  }
}

function reading(updatedAt: number, chapter = 3) {
  return {
    bookId: 43,
    bookName: 'João',
    bookAbbrev: 'jo',
    testament: 'NT',
    chapter,
    verse: 16,
    updatedAt
  }
}

function seedLocalBookmarks(bookmarks: ReturnType<typeof bookmark>[]) {
  localStorage.setItem('momai_biblia_v1_bookmarks', JSON.stringify(bookmarks))
}

describe('Sincronização da tela com o worker', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedTool.mockReset()
  })

  it('espelha um marcador novo no worker ao adicionar', async () => {
    mockedTool.mockResolvedValue({ ok: true } as never)
    bibleStorage.addBookmark({
      bookId: 43,
      bookName: 'João',
      bookAbbrev: 'jo',
      testament: 'NT',
      chapter: 3,
      verse: 16,
      text: 'Porque Deus amou o mundo...'
    })

    await vi.waitFor(() => {
      expect(mockedTool).toHaveBeenCalledWith(
        'import_bookmarks',
        expect.objectContaining({ bookmarks: expect.any(Array) })
      )
    })
    const call = mockedTool.mock.calls.find(([tool]) => tool === 'import_bookmarks')!
    expect((call[1] as { bookmarks: unknown[] }).bookmarks).toHaveLength(1)
  })

  it('adota os marcadores do worker na hidratação', async () => {
    seedLocalBookmarks([bookmark({ id: 'local', verse: 15 })])
    const remote = [bookmark({ id: 'remote' })]
    mockedTool.mockImplementation(async (tool) => {
      if (tool === 'list_bookmarks') return { ok: true, total: 1, bookmarks: remote } as never
      if (tool === 'get_last_reading') return { ok: true, reading: null, hasReading: false } as never
      return { ok: true } as never
    })

    const payload = await bibleStorage.hydrateFromWorker(true)
    expect(payload?.bookmarks?.[0]?.id).toBe('remote')
    expect(bibleStorage.getBookmarks()[0]?.id).toBe('remote')
  })

  it('migra marcadores antigos uma única vez quando o worker está vazio', async () => {
    seedLocalBookmarks([bookmark()])
    mockedTool.mockImplementation(async (tool) => {
      if (tool === 'list_bookmarks') return { ok: true, total: 0, bookmarks: [] } as never
      if (tool === 'get_last_reading') return { ok: true, reading: null, hasReading: false } as never
      return { ok: true } as never
    })

    await bibleStorage.hydrateFromWorker(true)
    expect(mockedTool).toHaveBeenCalledWith(
      'import_bookmarks',
      expect.objectContaining({ bookmarks: expect.any(Array) })
    )
    expect(localStorage.getItem('momai_biblia_v1_worker_migrated')).toBe('1')
    // Local bookmarks survive the migration
    expect(bibleStorage.getBookmarks()).toHaveLength(1)
  })

  it('adota a leitura mais recente do worker', async () => {
    localStorage.setItem('momai_biblia_v1_last_reading', JSON.stringify(reading(10, 1)))
    mockedTool.mockImplementation(async (tool) => {
      if (tool === 'list_bookmarks') return { ok: true, total: 0, bookmarks: [] } as never
      if (tool === 'get_last_reading') {
        return { ok: true, reading: reading(99, 8), hasReading: true } as never
      }
      return { ok: true } as never
    })

    const payload = await bibleStorage.hydrateFromWorker(true)
    expect(payload?.lastReading?.chapter).toBe(8)
    expect(bibleStorage.getLastReading().chapter).toBe(8)
  })

  it('envia a leitura local pendente em vez de sobrescrevê-la', async () => {
    mockedTool.mockResolvedValue({ ok: true } as never)
    bibleStorage.setLastReading(reading(500, 12))

    await vi.waitFor(() => {
      expect(mockedTool).toHaveBeenCalledWith(
        'set_last_reading',
        expect.objectContaining({ bookId: 43, chapter: 12 })
      )
    })
  })

  it('informa o idioma ativo ao worker ao trocar a tradução', async () => {
    mockedTool.mockResolvedValue({ ok: true } as never)
    bibleStorage.setBibleLanguageId('en-US')

    await vi.waitFor(() => {
      expect(mockedTool).toHaveBeenCalledWith('set_active_language', { languageId: 'en-US' })
    })
  })

  it('notifica os ouvintes quando dados novos chegam do worker', async () => {
    seedLocalBookmarks([bookmark({ id: 'local', verse: 15 })])
    const listener = vi.fn()
    bibleStorage.onHydrated(listener)
    mockedTool.mockImplementation(async (tool) => {
      if (tool === 'list_bookmarks') {
        return { ok: true, total: 1, bookmarks: [bookmark({ id: 'remote' })] } as never
      }
      if (tool === 'get_last_reading') return { ok: true, reading: null, hasReading: false } as never
      return { ok: true } as never
    })

    await bibleStorage.hydrateFromWorker(true)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ bookmarks: expect.any(Array) }))
  })
})
