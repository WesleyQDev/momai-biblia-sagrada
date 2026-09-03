declare module 'momai:sdk' {
  const sdk: {
    api: {
      get<T = any>(path: string, params?: Record<string, any>): Promise<{ ok: boolean; data?: T; error?: string }>
      post<T = any>(path: string, body?: any): Promise<{ ok: boolean; data?: T; error?: string }>
    }
    storage: {
      get<T = any>(key: string): Promise<T | null>
      set(key: string, value: any): Promise<void>
      delete(key: string): Promise<void>
      listKeys(): Promise<string[]>
    }
    events: {
      subscribe<T = any>(type: string, handler: (data: T) => void): () => void
      unsubscribe(type: string, handler: (data: any) => void): void
    }
    notifications: {
      send(opts: { title: string; body?: string; action?: string }): Promise<void>
    }
  }
  export default sdk
}

declare module 'momai:events' {
  export function useExtensionEvents(extensionId: string, handlers: Record<string, (data: any) => void>): void
}
