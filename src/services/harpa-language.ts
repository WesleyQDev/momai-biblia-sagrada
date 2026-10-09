import type { BibleLanguageId } from './bible-languages'

type HarpaLanguageLoader = (id: BibleLanguageId) => Promise<void>

let registeredLoader: HarpaLanguageLoader | null = null

/**
 * Called by harpa-data when it loads. Letting callers apply a language
 * synchronously once the hymnal is present keeps the reader/labels instant,
 * while the first use in a bundle without the Harpa still lazily imports it.
 */
export function registerHarpaLanguageLoader(loader: HarpaLanguageLoader): void {
  registeredLoader = loader
}

export function loadHarpaLanguageDeferred(id: BibleLanguageId): Promise<void> {
  if (registeredLoader) return registeredLoader(id)
  return import('./harpa-data').then((mod) => {
    registeredLoader = mod.harpaData.loadHarpaLanguage.bind(mod.harpaData)
    return registeredLoader(id)
  })
}
