import {
  buildBookLookup,
  buildVerseIndex,
  clampSearchLimit,
  findBook,
  getChapterFromBooks,
  getVerseFromBooks,
  parseVerseReference,
  searchReference,
  searchVerseIndex,
  type BookLookup,
  type IndexedVerse
} from '../src/services/bible-search-core.ts'
import { CURATED_PASSAGES } from '../src/services/curated-verse-refs.ts'
import type { BibleVerse, RawBibleBook } from '../src/types/bible.ts'

/**
 * Bible tool implementations used by the persistent background worker.
 *
 * The module is deliberately free of Node APIs, IPC and bundled JSON: the
 * worker (runtime.ts) and the tests inject the active dataset, the host
 * storage, and the event emitter, so every tool can be exercised in isolation.
 */

export interface BibleToolStorage {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

export interface BibleTranslationInfo {
  id: string
  name: string
  short: string
}

export interface BibleToolsDeps {
  /** Books of the translation the reader currently has selected. */
  getBooks(): Promise<RawBibleBook[]>
  /** Translation metadata matching getBooks(). */
  getTranslation(): Promise<BibleTranslationInfo>
  storage: BibleToolStorage
  /** Sends an extension event to the host (automations, listeners). */
  emit(eventType: string, data: Record<string, unknown>): void
  /** Validates a language id before persisting it. */
  isValidLanguage(id: unknown): boolean
  now?(): number
}

export const BOOKMARKS_KEY = 'bookmarks'
export const READING_KEY = 'reading-progress'
export const ACTIVE_LANGUAGE_KEY = 'active-language'
export const MAX_BOOKMARKS = 2000

interface DatasetContext {
  id: string
  books: RawBibleBook[]
  lookup: BookLookup
  index: IndexedVerse[]
}

interface BibleBookmark {
  id: string
  bookId: number
  bookName: string
  bookAbbrev: string
  testament: string
  chapter: number
  verse: number
  text: string
  note: string
  createdAt: number
}

interface ReadingProgress {
  bookId: number
  bookName: string
  bookAbbrev: string
  testament: string
  chapter: number
  verse: number
  updatedAt: number
}

function asInteger(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(num) ? num : null
}

function isBookmark(value: unknown): value is BibleBookmark {
  if (!value || typeof value !== 'object') return false
  const b = value as Record<string, unknown>
  return (
    typeof b.id === 'string' &&
    Number.isInteger(b.bookId) &&
    Number.isInteger(b.chapter) &&
    Number.isInteger(b.verse) &&
    typeof b.text === 'string'
  )
}

function isReading(value: unknown): value is ReadingProgress {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return Number.isInteger(r.bookId) && Number.isInteger(r.chapter)
}

export function createBibleTools(deps: BibleToolsDeps) {
  const now = deps.now ?? (() => Date.now())
  let context: DatasetContext | null = null

  async function getContext(): Promise<DatasetContext> {
    const translation = await deps.getTranslation()
    if (context && context.id === translation.id) return context
    const books = await deps.getBooks()
    context = {
      id: translation.id,
      books,
      lookup: buildBookLookup(books),
      index: buildVerseIndex(books)
    }
    return context
  }

  async function loadBookmarks(): Promise<BibleBookmark[]> {
    const stored = await deps.storage.get(BOOKMARKS_KEY)
    return Array.isArray(stored) ? stored.filter(isBookmark) : []
  }

  async function saveBookmarks(bookmarks: BibleBookmark[]): Promise<void> {
    await deps.storage.set(BOOKMARKS_KEY, bookmarks)
  }

  async function loadReading(): Promise<ReadingProgress | null> {
    const stored = await deps.storage.get(READING_KEY)
    return isReading(stored) ? stored : null
  }

  async function saveReading(reading: ReadingProgress): Promise<void> {
    await deps.storage.set(READING_KEY, reading)
  }

  function buildReading(ctx: DatasetContext, args: any): ReadingProgress {
    const source = args?.reading && typeof args.reading === 'object' ? args.reading : args
    const bookId = asInteger(source?.bookId)
    const chapter = asInteger(source?.chapter)
    if (bookId === null || chapter === null) {
      throw new Error('bookId e chapter são obrigatórios.')
    }
    if (bookId < 1 || bookId > 66) {
      throw new Error(`Livro ${bookId} inválido.`)
    }
    const book = ctx.books[bookId - 1]
    if (!book) throw new Error(`Livro ${bookId} não encontrado.`)
    if (chapter < 1 || chapter > book.chapters.length) {
      throw new Error(`Capítulo ${chapter} inválido para ${book.name}.`)
    }
    const verse = asInteger(source?.verse) ?? 1
    return {
      bookId,
      bookName: book.name,
      bookAbbrev: book.abbrev,
      testament: book.testament,
      chapter,
      verse: verse >= 1 ? verse : 1,
      updatedAt: now()
    }
  }

  async function pickRandomVerse(ctx: DatasetContext, testament: string): Promise<BibleVerse | undefined> {
    const inTestament = (bookId: number) =>
      testament === 'ALL' || ctx.books[bookId - 1]?.testament === testament

    // 70% chance to select a curated verse for high devocional quality
    if (Math.random() < 0.7) {
      const curated = CURATED_PASSAGES.filter((passage) => inTestament(passage.bookId))
      if (curated.length > 0) {
        const item = curated[Math.floor(Math.random() * curated.length)]
        const verse = getVerseFromBooks(ctx.books, item.bookId, item.chapter, item.verse)
        if (verse) return verse
      }
    }

    const candidates = ctx.books.filter((book) => testament === 'ALL' || book.testament === testament)
    for (let attempts = 0; attempts < 10; attempts++) {
      const book = candidates[Math.floor(Math.random() * candidates.length)]
      if (!book || book.chapters.length === 0) continue
      const chapter = Math.floor(Math.random() * book.chapters.length) + 1
      const verses = book.chapters[chapter - 1]
      if (!verses || verses.length === 0) continue
      const verseNum = Math.floor(Math.random() * verses.length) + 1
      const text = verses[verseNum - 1]
      if (text && text.length >= 30 && text.length <= 260) {
        return getVerseFromBooks(ctx.books, book.id, chapter, verseNum)
      }
    }

    return getVerseFromBooks(ctx.books, 43, 3, 16)
  }

  async function execute(toolName: string, args: any = {}): Promise<Record<string, unknown>> {
    try {
      switch (toolName) {
        case 'command': {
          const actualTool = args?.toolName || args?.tool
          const actualArgs = args?.args || args
          if (actualTool && actualTool !== 'command') {
            return execute(actualTool, actualArgs)
          }
          return { ok: false, error: 'Ferramenta ausente no comando.' }
        }

        case 'search_bible': {
          const ctx = await getContext()
          const query = typeof args?.query === 'string' ? args.query : ''
          if (!query.trim()) {
            return { ok: false, error: 'Consulta vazia.' }
          }
          const testament = args?.testament === 'AT' || args?.testament === 'NT' ? args.testament : 'ALL'
          const limit = clampSearchLimit(args?.limit)
          const reference = parseVerseReference(query, ctx.lookup)
          const referenceHits = reference ? searchReference(ctx.books, reference, limit) : []
          const textHits = searchVerseIndex(ctx.index, query, { testament, limit })
          const merged = [...referenceHits, ...textHits]
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
          const results = merged.map((hit) => ({
            id: hit.verse.id,
            bookId: hit.verse.bookId,
            bookName: hit.verse.bookName,
            bookAbbrev: hit.verse.bookAbbrev,
            testament: hit.verse.testament,
            chapter: hit.verse.chapter,
            verse: hit.verse.verse,
            text: hit.verse.text,
            matchType: hit.matchType
          }))
          return {
            ok: true,
            total: results.length,
            results,
            translation: ctx.id
          }
        }

        case 'get_verse': {
          const ctx = await getContext()
          const book = findBook(ctx.lookup, args?.book, ctx.books)
          if (!book) return { ok: false, error: `Livro "${String(args?.book ?? '')}" não encontrado na Bíblia.` }
          const chapter = asInteger(args?.chapter)
          const verseNum = asInteger(args?.verse)
          if (chapter === null || verseNum === null) {
            return { ok: false, error: 'Capítulo e versículo precisam ser números inteiros.' }
          }
          const verse = getVerseFromBooks(ctx.books, book.id, chapter, verseNum)
          if (!verse) {
            return { ok: false, error: `Versículo ${book.name} ${chapter}:${verseNum} não encontrado.` }
          }
          return {
            ok: true,
            verse,
            reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
            text: verse.text,
            translation: ctx.id
          }
        }

        case 'get_chapter': {
          const ctx = await getContext()
          const book = findBook(ctx.lookup, args?.book, ctx.books)
          if (!book) return { ok: false, error: `Livro "${String(args?.book ?? '')}" não encontrado.` }
          const chapter = asInteger(args?.chapter)
          if (chapter === null || chapter < 1 || chapter > book.chapters.length) {
            return {
              ok: false,
              error: `Capítulo ${String(args?.chapter ?? '')} inválido para ${book.name} (possui ${book.chapters.length} capítulos).`
            }
          }
          const verses = getChapterFromBooks(ctx.books, book.id, chapter).map((verse) => ({
            verse: verse.verse,
            text: verse.text
          }))
          return {
            ok: true,
            book: book.name,
            chapter,
            totalVerses: verses.length,
            verses,
            translation: ctx.id
          }
        }

        case 'get_random_verse': {
          const ctx = await getContext()
          const testament = args?.testament === 'AT' || args?.testament === 'NT' ? args.testament : 'ALL'
          const verse = await pickRandomVerse(ctx, testament)
          if (!verse) {
            return { ok: false, error: 'Não foi possível selecionar um versículo.' }
          }
          deps.emit('bible_daily_verse', {
            reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
            text: verse.text,
            book: verse.bookName,
            chapter: verse.chapter,
            verse: verse.verse,
            translation: ctx.id
          })
          return {
            ok: true,
            verse,
            reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
            translation: ctx.id
          }
        }

        case 'get_last_reading': {
          const reading = await loadReading()
          return { ok: true, reading, hasReading: reading !== null }
        }

        case 'list_bookmarks': {
          const ctx = await getContext()
          const bookmarks = await loadBookmarks()
          const bookQuery = typeof args?.book === 'string' ? args.book : ''
          const filtered = bookQuery ? bookmarks.filter((b) => b.bookId === findBook(ctx.lookup, bookQuery, ctx.books)?.id) : bookmarks
          return {
            ok: true,
            total: filtered.length,
            bookmarks: filtered,
            translation: ctx.id
          }
        }

        case 'add_bookmark': {
          const ctx = await getContext()
          const book = findBook(ctx.lookup, args?.book, ctx.books)
          if (!book) return { ok: false, error: `Livro "${String(args?.book ?? '')}" não encontrado.` }
          const chapter = asInteger(args?.chapter)
          const verseNum = asInteger(args?.verse)
          if (chapter === null || verseNum === null) {
            return { ok: false, error: 'Capítulo e versículo precisam ser números inteiros.' }
          }
          const verse = getVerseFromBooks(ctx.books, book.id, chapter, verseNum)
          if (!verse) return { ok: false, error: 'Versículo não encontrado.' }

          const bookmarks = await loadBookmarks()
          const created = !bookmarks.some(
            (b) => b.bookId === book.id && b.chapter === chapter && b.verse === verseNum
          )
          const bookmark: BibleBookmark = {
            id: `${book.abbrev}-${chapter}-${verseNum}-${now()}`,
            bookId: book.id,
            bookName: book.name,
            bookAbbrev: book.abbrev,
            testament: book.testament,
            chapter,
            verse: verseNum,
            text: verse.text,
            note: typeof args?.note === 'string' ? args.note : '',
            createdAt: now()
          }
          const updated = bookmarks.filter(
            (b) => !(b.bookId === book.id && b.chapter === chapter && b.verse === verseNum)
          )
          updated.unshift(bookmark)
          await saveBookmarks(updated.slice(0, MAX_BOOKMARKS))

          if (created) {
            deps.emit('bible_bookmark_created', {
              reference: `${book.name} ${chapter}:${verseNum}`,
              text: verse.text,
              book: book.name,
              translation: ctx.id
            })
          }

          return { ok: true, bookmark, created }
        }

        case 'remove_bookmark': {
          const id = typeof args?.id === 'string' ? args.id : ''
          if (!id) return { ok: false, error: 'Informe o id do marcador.' }
          const bookmarks = await loadBookmarks()
          const removed = bookmarks.find(
            (b) => b.id === id || `${b.bookAbbrev}-${b.chapter}-${b.verse}` === id
          )
          if (!removed) {
            return { ok: true, removed: false, error: 'Marcador não encontrado.' }
          }
          await saveBookmarks(bookmarks.filter((b) => b.id !== removed.id))
          deps.emit('bible_bookmark_removed', {
            bookmarkId: removed.id,
            reference: `${removed.bookName} ${removed.chapter}:${removed.verse}`
          })
          return { ok: true, removed: true }
        }

        case 'set_last_reading': {
          const ctx = await getContext()
          const previous = await loadReading()
          const reading = buildReading(ctx, args)
          await saveReading(reading)
          const changed =
            !previous || previous.bookId !== reading.bookId || previous.chapter !== reading.chapter
          if (changed) {
            deps.emit('bible_reading_progress', {
              book: reading.bookName,
              chapter: reading.chapter,
              testament: reading.testament,
              translation: ctx.id
            })
          }
          return { ok: true, reading }
        }

        case 'import_bookmarks': {
          const incoming = Array.isArray(args?.bookmarks) ? args.bookmarks : []
          const valid = incoming.filter(isBookmark)
          if (valid.length === 0) {
            return { ok: true, imported: 0, total: (await loadBookmarks()).length }
          }
          const current = await loadBookmarks()
          const byRef = new Map<string, BibleBookmark>()
          const keyOf = (b: BibleBookmark) => `${b.bookId}-${b.chapter}-${b.verse}`
          for (const bookmark of current) byRef.set(keyOf(bookmark), bookmark)
          let imported = 0
          for (const bookmark of valid) {
            const key = keyOf(bookmark)
            const existing = byRef.get(key)
            if (!existing || (bookmark.createdAt || 0) >= (existing.createdAt || 0)) {
              byRef.set(key, bookmark)
              imported += 1
            }
          }
          const merged = [...byRef.values()]
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, MAX_BOOKMARKS)
          await saveBookmarks(merged)
          return { ok: true, imported, total: merged.length }
        }

        case 'report_daily_verse': {
          const reference = typeof args?.reference === 'string' ? args.reference.trim() : ''
          const text = typeof args?.text === 'string' ? args.text.trim() : ''
          if (!reference || !text) {
            return { ok: false, error: 'reference e text são obrigatórios.' }
          }
          deps.emit('bible_daily_verse', {
            reference,
            text,
            book: typeof args?.book === 'string' ? args.book : '',
            chapter: asInteger(args?.chapter) ?? 0,
            verse: asInteger(args?.verse) ?? 0
          })
          return { ok: true }
        }

        case 'set_active_language': {
          const languageId = args?.languageId
          if (!deps.isValidLanguage(languageId)) {
            return { ok: false, error: `Idioma "${String(languageId ?? '')}" não suportado.` }
          }
          await deps.storage.set(ACTIVE_LANGUAGE_KEY, languageId)
          return { ok: true, languageId }
        }

        default:
          return { ok: false, error: `Ferramenta desconhecida: ${toolName}` }
      }
    } catch (err: any) {
      return { ok: false, error: err?.message || String(err) }
    }
  }

  return { execute }
}
