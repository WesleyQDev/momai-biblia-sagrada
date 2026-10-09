// runtime.ts
// MomAI Bíblia Sagrada persistent background worker.
// Hosts the AI tools (search, reading, bookmarks) over the host-owned SQLite
// storage and emits extension events. Tool logic lives in lib/bible-tools.ts
// and is shared with the reader through src/services/bible-search-core.ts.
//
// Persistence contract: only host storage (worker storage handled by Node Core
// over IPC) is written. Bundled datasets are read-only assets of the extension.

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

// ---------------------------------------------------------------------------
// Host storage (SQLite via IPC). No JSON files are written by the extension.
// ---------------------------------------------------------------------------

let storageResponseListener: ((msg: any) => void) | null = null
let ipcStorage: any = null

function getIpcStorage(): any {
  if (ipcStorage) return ipcStorage
  const { createIpcBibliaStorage } = require('./storage-ipc.ts')
  ipcStorage = createIpcBibliaStorage({
    send: (msg: any) => safeSend(msg),
    onResponse: (fn: (msg: any) => void) => {
      storageResponseListener = fn
    },
    storageDir: 'momai-biblia-sagrada'
  })
  return ipcStorage
}

function useHostStorage(): boolean {
  return typeof process.send === 'function'
}

const workerStorage = {
  async get(key: string) {
    if (!useHostStorage()) return null
    return getIpcStorage().storage.get(key)
  },
  async set(key: string, value: unknown) {
    if (!useHostStorage()) return
    await getIpcStorage().storage.set(key, value)
  }
}

// ---------------------------------------------------------------------------
// Datasets: the worker follows the translation selected in the reader and
// reads the bundled JSON on demand, keeping only the loaded ones in memory.
// ---------------------------------------------------------------------------

let toolsPromise: Promise<{ execute: (toolName: string, args?: any) => Promise<any> }> | null = null

function getTools() {
  if (!toolsPromise) toolsPromise = initTools()
  return toolsPromise
}

async function initTools() {
  const [{ createBibleTools, ACTIVE_LANGUAGE_KEY }, languages] = await Promise.all([
    import('./lib/bible-tools.ts'),
    import('./src/services/bible-languages.ts')
  ])

  const datasets = new Map<string, any[]>()
  let activeId: any = languages.DEFAULT_BIBLE_LANGUAGE_ID
  let lastLanguageCheck = 0

  // Works both from the source root (runtime.ts) and from the packaged
  // dist/runtime.js bundle, where assets live one level up.
  function resolveAssetPath(...segments: string[]): string {
    const direct = path.join(__dirname, ...segments)
    if (fs.existsSync(direct)) return direct
    return path.join(__dirname, '..', ...segments)
  }

  function readDataset(id: string): any[] {
    const meta = languages.BIBLE_LANGUAGES.find((lang: any) => lang.id === id)
    if (!meta) throw new Error(`Unknown Bible language: ${String(id)}`)
    const cached = datasets.get(id)
    if (cached) return cached
    const datasetPath = resolveAssetPath('assets', 'bible', meta.file)
    const books = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
    if (!Array.isArray(books) || books.length !== 66) {
      throw new Error(`Invalid bundled Bible dataset for ${id}`)
    }
    datasets.set(id, books)
    return books
  }

  async function refreshActiveLanguage(): Promise<void> {
    const current = Date.now()
    if (current - lastLanguageCheck < 1000) return
    lastLanguageCheck = current
    try {
      const stored = await workerStorage.get(ACTIVE_LANGUAGE_KEY)
      if (languages.isBibleLanguageId(stored)) activeId = stored
    } catch {
      // Keep the last known language when storage is unavailable.
    }
  }

  async function readTranslation() {
    await refreshActiveLanguage()
    return languages.getBibleLanguage(activeId)
  }

  return createBibleTools({
    getBooks: async () => {
      await refreshActiveLanguage()
      return readDataset(activeId)
    },
    getTranslation: async () => {
      const meta = await readTranslation()
      return { id: meta.id, name: meta.translationName, short: meta.translationShort }
    },
    storage: workerStorage,
    emit: (eventType: string, data: Record<string, unknown>) => {
      safeSend({ type: 'event', eventType, data })
    },
    isValidLanguage: languages.isBibleLanguageId
  })
}

// Periodic heartbeat to the Node Core health monitor. Unref keeps the timer
// from holding the process on its own; the IPC channel keeps it alive.
const heartbeat = setInterval(() => {
  safeSend({ type: 'heartbeat', timestamp: Date.now() })
}, 30000)
if (typeof heartbeat.unref === 'function') heartbeat.unref()

// Immediately emit ready to the host manager
safeSend({ type: 'ready' })

process.on('message', async (msg: any) => {
  if (!msg || typeof msg !== 'object') return
  if (msg.type === 'storage-response') {
    try {
      storageResponseListener?.(msg)
    } catch {}
    return
  }
  if (msg.type === 'execute') {
    const { requestId } = msg
    const source = msg.payload || msg
    const { toolName, args } = source || {}
    try {
      const tools = await getTools()
      const result = await tools.execute(toolName, args)
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
  execute: (toolName: string, args?: any) => getTools().then((tools) => tools.execute(toolName, args))
}
