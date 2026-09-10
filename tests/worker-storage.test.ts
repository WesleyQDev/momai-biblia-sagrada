import { describe, it, expect } from 'vitest'
import { createIpcBibliaStorage } from '../storage-ipc'

describe('biblia worker storage uses host SQLite via IPC', () => {
  it('routes get/set through storage-request instead of local JSON files', async () => {
    const sent: Array<{ type?: string; method?: string; args?: unknown[]; requestId?: string }> = []
    const holder: { current: ((msg: { type?: string; requestId?: string; result?: { ok?: boolean; value?: unknown; error?: string; errorCode?: string } }) => void) | null } = {
      current: null
    }
    const bridge = createIpcBibliaStorage({
      send: (msg: unknown) => {
        sent.push(msg as { type?: string; method?: string; args?: unknown[]; requestId?: string })
      },
      onResponse: (fn: (msg: { type?: string; requestId?: string; result?: { ok?: boolean; value?: unknown; error?: string; errorCode?: string } }) => void) => {
        holder.current = fn
      },
      storageDir: '/tmp/biblia-display-only'
    })

    const pendingGet = bridge.storage.get('bookmarks')
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ type: 'storage-request', method: 'storage.get' })
    expect(Array.isArray(sent[0].args)).toBe(true)
    expect(sent[0].args?.[0]).toBe('bookmarks')

    holder.current?.({
      type: 'storage-response',
      requestId: sent[0].requestId,
      result: { ok: true, value: [] }
    })
    await expect(pendingGet).resolves.toEqual([])

    sent.length = 0
    const pendingSet = bridge.storage.set('bookmarks', [])
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ type: 'storage-request', method: 'storage.set' })

    holder.current?.({
      type: 'storage-response',
      requestId: sent[0].requestId,
      result: { ok: true, value: undefined }
    })
    await expect(pendingSet).resolves.toBeUndefined()
  })
})
