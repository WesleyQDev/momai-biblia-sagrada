const BIBLE_EXTENSION_ID = 'momai-biblia-sagrada'
const COMMAND_PATH = `/extensions/${BIBLE_EXTENSION_ID}/command`

interface WorkerCommandResult {
  ok?: boolean
  error?: string
  [key: string]: unknown
}

type SdkApi = { post?: (path: string, body?: unknown) => Promise<unknown> }
type PreloadApi = {
  executeExtensionCommand?: (extensionId: string, payload: unknown) => Promise<unknown>
}

function getWindow(): (Window & { MomAISDK?: { api?: SdkApi }; api?: PreloadApi }) | null {
  if (typeof window === 'undefined') return null
  return window as Window & { MomAISDK?: { api?: SdkApi }; api?: PreloadApi }
}

/**
 * True when the host exposes the UI -> worker command bridge. False in unit
 * tests, in the browser preview and in older hosts; callers then keep working
 * against the local cache only.
 */
export function hasWorkerBridge(): boolean {
  const win = getWindow()
  if (!win) return false
  return Boolean(win.MomAISDK?.api?.post || win.api?.executeExtensionCommand)
}

/**
 * Runs one of the extension's declared tools inside the persistent background
 * worker (the same process the AI uses), which owns the host SQLite storage.
 * Returns null on any failure so callers can fall back to their local cache.
 */
export async function executeBibleTool<T = WorkerCommandResult>(
  toolName: string,
  args: Record<string, unknown> = {},
  timeoutMs = 8000
): Promise<T | null> {
  const win = getWindow()
  if (!win) return null

  const body = { toolName, args, timeoutMs }
  try {
    let data: unknown
    if (win.MomAISDK?.api?.post) {
      const res = (await win.MomAISDK.api.post(COMMAND_PATH, body)) as { data?: unknown } | unknown
      data =
        res && typeof res === 'object' && 'data' in res
          ? (res as { data?: unknown }).data
          : res
    } else if (win.api?.executeExtensionCommand) {
      data = await win.api.executeExtensionCommand(BIBLE_EXTENSION_ID, body)
    } else {
      return null
    }

    if (!data || typeof data !== 'object') return null
    const result = data as WorkerCommandResult
    if (result.ok === false) {
      if (result.error) {
        console.warn(`[biblia:worker] ${toolName} falhou:`, result.error)
      }
      return null
    }
    return result as T
  } catch (err) {
    console.warn(`[biblia:worker] ${toolName} indisponível:`, err)
    return null
  }
}
