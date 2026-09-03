// runtime.ts
// MomAI Bíblia Sagrada persistent background worker
// Handles IPC tool execution for Assistant, automations, and background events

const fs = require('node:fs')
const path = require('node:path')

function safeSend(msg: any) {
  try {
    if (typeof process.send === 'function') {
      process.send(msg)
    }
  } catch (err: any) {
    console.warn('[runtime:momai-biblia-sagrada] IPC send error:', err?.message || err)
  }
}

process.on('uncaughtException', (err: any) => {
  console.error('[runtime:momai-biblia-sagrada] Uncaught exception:', err)
})
process.on('unhandledRejection', (reason: any) => {
  console.error('[runtime:momai-biblia-sagrada] Unhandled rejection:', reason)
})

// Load raw bible dataset
let rawBibleBooks: any[] = []
try {
  const datasetPath = path.join(__dirname, 'assets', 'bible', 'almeida.json')
  if (fs.existsSync(datasetPath)) {
    rawBibleBooks = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
  }
} catch (e: any) {
  console.error('[runtime:momai-biblia-sagrada] Failed to load almeida.json:', e?.message || e)
}

// Normalized book lookup map
function normalizeString(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const bookLookup = new Map<string, any>()
for (const b of rawBibleBooks) {
  bookLookup.set(String(b.id), b)
  bookLookup.set(normalizeString(b.name), b)
  bookLookup.set(normalizeString(b.abbrev), b)
}

const aliases: Record<string, string> = {
  genesis: 'gn',
  exodo: 'ex',
  salmo: 'sl',
  salmos: 'sl',
  proverbio: 'pv',
  proverbios: 'pv',
  cantico: 'ct',
  canticos: 'ct',
  cantares: 'ct',
  lamentacoes: 'lm',
  apocalipse: 'ap',
  mateus: 'mt',
  marcos: 'mc',
  lucas: 'lc',
  joao: 'jo',
  atos: 'atos',
  romanos: 'rm',
  hebreus: 'hb',
  tiago: 'tg',
  judas: 'jd',
  '1joao': '1jo',
  '2joao': '2jo',
  '3joao': '3jo',
  '1pedro': '1pe',
  '2pedro': '2pe',
  '1corintios': '1co',
  '2corintios': '2co',
  '1tessalonicenses': '1ts',
  '2tessalonicenses': '2ts',
  '1timoteo': '1tm',
  '2timoteo': '2tm',
  '1samuel': '1sm',
  '2samuel': '2sm',
  '1reis': '1rs',
  '2reis': '2rs',
  '1cronicas': '1cr',
  '2cronicas': '2cr'
}

for (const [alias, targetAbbrev] of Object.entries(aliases)) {
  const target = bookLookup.get(targetAbbrev)
  if (target) bookLookup.set(alias, target)
}

function findBook(query: string | number): any | undefined {
  if (typeof query === 'number') return rawBibleBooks[query - 1]
  const clean = normalizeString(String(query))
  return bookLookup.get(clean)
}

function getVerse(bookId: number, chapter: number, verse: number) {
  const book = rawBibleBooks[bookId - 1]
  if (!book) return null
  if (chapter < 1 || chapter > book.chapters.length) return null
  const chVerses = book.chapters[chapter - 1] || []
  if (verse < 1 || verse > chVerses.length) return null
  return {
    id: `${book.abbrev}-${chapter}-${verse}`,
    bookId: book.id,
    bookName: book.name,
    bookAbbrev: book.abbrev,
    testament: book.testament,
    chapter,
    verse,
    text: chVerses[verse - 1]
  }
}

// Local persistent storage for bookmarks and reading progress in worker
const storageFile = path.join(__dirname, 'bookmarks.json')
const readingFile = path.join(__dirname, 'reading-progress.json')

function loadLocalBookmarks(): any[] {
  try {
    if (fs.existsSync(storageFile)) {
      return JSON.parse(fs.readFileSync(storageFile, 'utf8'))
    }
  } catch {}
  return []
}

function saveLocalBookmarks(bms: any[]) {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(bms, null, 2), 'utf8')
  } catch (e: any) {
    console.warn('[runtime:momai-biblia-sagrada] Failed to write bookmarks.json:', e)
  }
}

function loadLastReading(): any {
  try {
    if (fs.existsSync(readingFile)) {
      return JSON.parse(fs.readFileSync(readingFile, 'utf8'))
    }
  } catch {}
  return {
    bookId: 43,
    bookName: 'João',
    bookAbbrev: 'jo',
    testament: 'NT',
    chapter: 1,
    verse: 1,
    updatedAt: Date.now()
  }
}

// Search parser & search logic for LLM tools
function searchInBible(rawQuery: string, testament: string = 'ALL', limit: number = 10) {
  const clean = rawQuery.trim()
  if (!clean) return []

  // Check reference pattern: "João 3:16", "Sl 23:1"
  const refMatch = clean.match(/^([1-3]?\s*[a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(\d+)[:\s]+(\d+)$/i)
  if (refMatch) {
    const book = findBook(refMatch[1])
    if (book) {
      const ch = parseInt(refMatch[2], 10)
      const v = parseInt(refMatch[3], 10)
      const verse = getVerse(book.id, ch, v)
      if (verse) return [verse]
    }
  }

  // Chapter pattern: "Salmos 23"
  const chapMatch = clean.match(/^([1-3]?\s*[a-zA-Záàâãéèêíïóôõöúçñ]+)\s+(\d+)$/i)
  if (chapMatch) {
    const book = findBook(chapMatch[1])
    if (book) {
      const ch = parseInt(chapMatch[2], 10)
      if (ch >= 1 && ch <= book.chapters.length) {
        return (book.chapters[ch - 1] || []).slice(0, limit).map((text: string, idx: number) => ({
          id: `${book.abbrev}-${ch}-${idx + 1}`,
          bookId: book.id,
          bookName: book.name,
          bookAbbrev: book.abbrev,
          testament: book.testament,
          chapter: ch,
          verse: idx + 1,
          text
        }))
      }
    }
  }

  // Keyword / phrase search across all books
  const normQuery = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim()

  const tokens = normQuery.split(' ').filter(Boolean)
  if (tokens.length === 0) return []

  const results: any[] = []

  for (const book of rawBibleBooks) {
    if (testament !== 'ALL' && book.testament !== testament) continue

    for (let c = 0; c < book.chapters.length; c++) {
      const ch = c + 1
      const verses = book.chapters[c]

      for (let v = 0; v < verses.length; v++) {
        const text = verses[v]
        const normText = text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ')

        // Check if all tokens are present
        const matchesAll = tokens.every((tok: string) => normText.includes(tok))
        if (matchesAll) {
          results.push({
            id: `${book.abbrev}-${ch}-${v + 1}`,
            bookId: book.id,
            bookName: book.name,
            bookAbbrev: book.abbrev,
            testament: book.testament,
            chapter: ch,
            verse: v + 1,
            text
          })

          if (results.length >= limit) return results
        }
      }
    }
  }

  return results
}

// Periodic heartbeat to NodeCore health monitor to keep persistent worker alive
setInterval(() => {
  safeSend({ type: 'heartbeat', timestamp: Date.now() })
}, 30000)

// Immediately emit ready to host-manager
safeSend({ type: 'ready' })

/**
 * Tool Execution Dispatcher
 */
async function executeTool(toolName: string, args: any = {}): Promise<any> {
  switch (toolName) {
    case 'command': {
      const actualTool = args?.toolName || args?.tool
      const actualArgs = args?.args || args
      if (actualTool && actualTool !== 'command') {
        return executeTool(actualTool, actualArgs)
      }
      return { ok: false, error: 'Ferramenta ausente no comando.' }
    }

    case 'search_bible': {
      const query = args?.query || ''
      const testament = args?.testament || 'ALL'
      const limit = typeof args?.limit === 'number' ? args.limit : 10
      const results = searchInBible(query, testament, limit)
      return {
        ok: true,
        query,
        total: results.length,
        results,
        instruction: results.length === 0
          ? `Nenhum versículo encontrado para "${query}".`
          : `Encontrados ${results.length} versículo(s) para "${query}".`,
        directResponse: results.length === 0
          ? `Não encontrei passagens bíblicas para "${query}".`
          : results.map((r: any) => `• ${r.bookName} ${r.chapter}:${r.verse} - "${r.text}"`).join('\n')
      }
    }

    case 'get_verse': {
      const book = findBook(args?.book)
      if (!book) return { ok: false, error: `Livro "${args?.book}" não encontrado na Bíblia.` }
      const ch = parseInt(args?.chapter, 10)
      const v = parseInt(args?.verse, 10)
      const verse = getVerse(book.id, ch, v)
      if (!verse) return { ok: false, error: `Versículo ${book.name} ${ch}:${v} não encontrado.` }
      return {
        ok: true,
        verse,
        reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
        text: verse.text,
        directResponse: `"${verse.text}" (${verse.bookName} ${verse.chapter}:${verse.verse} - Almeida)`
      }
    }

    case 'get_chapter': {
      const book = findBook(args?.book)
      if (!book) return { ok: false, error: `Livro "${args?.book}" não encontrado.` }
      const ch = parseInt(args?.chapter, 10)
      if (ch < 1 || ch > book.chapters.length) {
        return { ok: false, error: `Capítulo ${ch} inválido para ${book.name} (possui ${book.chapters.length} capítulos).` }
      }
      const verses = (book.chapters[ch - 1] || []).map((text: string, idx: number) => ({
        verse: idx + 1,
        text
      }))
      return {
        ok: true,
        book: book.name,
        chapter: ch,
        totalVerses: verses.length,
        verses,
        directResponse: `${book.name} capítulo ${ch} possui ${verses.length} versículos.`
      }
    }

    case 'get_random_verse': {
      const testament = args?.testament || 'ALL'
      const candidates =
        testament === 'AT'
          ? rawBibleBooks.filter((b: any) => b.testament === 'AT')
          : testament === 'NT'
            ? rawBibleBooks.filter((b: any) => b.testament === 'NT')
            : rawBibleBooks

      const randomBook = candidates[Math.floor(Math.random() * candidates.length)]
      const randomChapter = Math.floor(Math.random() * randomBook.chapters.length) + 1
      const chVerses = randomBook.chapters[randomChapter - 1]
      const randomVerseNum = Math.floor(Math.random() * chVerses.length) + 1
      const verse = getVerse(randomBook.id, randomChapter, randomVerseNum)

      // Emit daily verse event for automations
      if (verse) {
        safeSend({
          type: 'event',
          eventType: 'bible_daily_verse',
          data: {
            reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
            text: verse.text,
            book: verse.bookName,
            chapter: verse.chapter,
            verse: verse.verse
          }
        })
      }

      return {
        ok: true,
        verse,
        reference: verse ? `${verse.bookName} ${verse.chapter}:${verse.verse}` : '',
        directResponse: verse ? `"${verse.text}" (${verse.bookName} ${verse.chapter}:${verse.verse})` : ''
      }
    }

    case 'get_last_reading': {
      const reading = loadLastReading()
      return {
        ok: true,
        reading,
        directResponse: `Sua última leitura foi em ${reading.bookName} capítulo ${reading.chapter}.`
      }
    }

    case 'list_bookmarks': {
      const bookmarks = loadLocalBookmarks()
      const bookFilter = args?.book ? normalizeString(args.book) : null
      const filtered = bookFilter
        ? bookmarks.filter((b: any) => normalizeString(b.bookName) === bookFilter || normalizeString(b.bookAbbrev) === bookFilter)
        : bookmarks

      return {
        ok: true,
        total: filtered.length,
        bookmarks: filtered,
        directResponse: filtered.length === 0
          ? 'Nenhum versículo marcado encontrado.'
          : `Você possui ${filtered.length} marcador(es): ${filtered.map((b: any) => `${b.bookName} ${b.chapter}:${b.verse}`).join(', ')}`
      }
    }

    case 'add_bookmark': {
      const book = findBook(args?.book)
      if (!book) return { ok: false, error: `Livro "${args?.book}" não encontrado.` }
      const ch = parseInt(args?.chapter, 10)
      const v = parseInt(args?.verse, 10)
      const verse = getVerse(book.id, ch, v)
      if (!verse) return { ok: false, error: `Versículo não encontrado.` }

      const bookmarks = loadLocalBookmarks()
      const newBm = {
        id: `${book.abbrev}-${ch}-${v}-${Date.now()}`,
        bookId: book.id,
        bookName: book.name,
        bookAbbrev: book.abbrev,
        testament: book.testament,
        chapter: ch,
        verse: v,
        text: verse.text,
        note: args?.note || '',
        createdAt: Date.now()
      }

      const updated = bookmarks.filter((b: any) => !(b.bookId === book.id && b.chapter === ch && b.verse === v))
      updated.unshift(newBm)
      saveLocalBookmarks(updated)

      safeSend({
        type: 'event',
        eventType: 'bible_bookmark_created',
        data: {
          reference: `${book.name} ${ch}:${v}`,
          text: verse.text,
          book: book.name
        }
      })

      return {
        ok: true,
        bookmark: newBm,
        directResponse: `Versículo ${book.name} ${ch}:${v} adicionado aos seus marcadores com sucesso.`
      }
    }

    case 'remove_bookmark': {
      const id = args?.id || ''
      const bookmarks = loadLocalBookmarks()
      const updated = bookmarks.filter((b: any) => b.id !== id && `${b.bookAbbrev}-${b.chapter}-${b.verse}` !== id)
      saveLocalBookmarks(updated)

      safeSend({
        type: 'event',
        eventType: 'bible_bookmark_removed',
        data: { bookmarkId: id, reference: id }
      })

      return {
        ok: true,
        directResponse: 'Marcador removido com sucesso.'
      }
    }

    default:
      return { ok: false, error: `Ferramenta desconhecida: ${toolName}` }
  }
}

// Process incoming IPC messages from MomAI extension host
process.on('message', async (msg: any) => {
  if (!msg || typeof msg !== 'object') return
  if (msg.type === 'execute') {
    const { requestId, payload } = msg
    const { toolName, args } = payload || {}
    try {
      const result = await executeTool(toolName, args)
      safeSend({ type: 'response', requestId, result })
    } catch (err: any) {
      safeSend({
        type: 'response',
        requestId,
        result: { ok: false, error: err?.message || String(err) }
      })
    }
  } else if (msg.type === 'shutdown') {
    process.exit(0)
  }
})

process.on('disconnect', () => {
  process.exit(0)
})

module.exports = {
  execute: executeTool,
  executeTool
}
