import { useState } from 'react'
import { vi } from 'vitest'

export function useExtensionVisibility(isActive: boolean = true) {
  return isActive
}

export function useWarmup() {}

export function useCachedState<T>(initialValue: T | (() => T)) {
  return useState(initialValue)
}

export const share = {
  open: vi.fn((_payload: any) => Promise.resolve({ ok: true })),
  close: vi.fn(),
  getProviders: vi.fn(() => []),
  registerProvider: vi.fn(() => () => {}),
  unregisterProvider: vi.fn(),
  subscribeProviders: vi.fn(() => () => {})
}

const sdk = {
  share,
  useExtensionVisibility,
  useWarmup,
  useCachedState
}

export const getSDK = () => sdk
export default sdk
