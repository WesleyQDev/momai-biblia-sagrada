import { useState } from 'react'

export function useExtensionVisibility(isActive: boolean = true) {
  return isActive
}

export function useWarmup() {}

export function useCachedState<T>(initialValue: T | (() => T)) {
  return useState(initialValue)
}

export const getSDK = () => ({})
export default {}
