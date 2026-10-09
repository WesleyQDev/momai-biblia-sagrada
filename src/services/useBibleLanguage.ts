import { useCallback, useEffect, useState } from 'react'
import { bibleData } from './bible-data'
import { bibleStorage } from './storage'
import { loadHarpaLanguageDeferred } from './harpa-language'
import {
  BIBLE_LANGUAGE_EVENT,
  isBibleLanguageId,
  notifyBibleLanguageChanged,
  type BibleLanguageId
} from './bible-languages'

export function useBibleLanguage() {
  const [languageId, setLanguageId] = useState<BibleLanguageId>(() =>
    bibleData.getActiveLanguageId()
  )
  const [datasetVersion, setDatasetVersion] = useState<number>(() =>
    bibleData.getDatasetVersion()
  )

  useEffect(() => {
    const unsubscribe = bibleData.subscribe(() => {
      setLanguageId(bibleData.getActiveLanguageId())
      setDatasetVersion(bibleData.getDatasetVersion())
    })

    // The page, the widget and the drawers are separate bundles, so each one
    // has its own dataset module. The DOM event keeps every mounted instance
    // on the language the user picked.
    const handleLanguageEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (isBibleLanguageId(detail) && detail !== bibleData.getActiveLanguageId()) {
        void bibleData
          .loadBibleLanguage(detail)
          .then(() => loadHarpaLanguageDeferred(detail))
          .catch((err) => {
            console.error('[biblia] Failed to follow Bible language change:', err)
          })
      }
    }
    window.addEventListener(BIBLE_LANGUAGE_EVENT, handleLanguageEvent)

    const preferred = bibleStorage.getBibleLanguageId() ?? bibleData.getActiveLanguageId()
    if (preferred !== bibleData.getActiveLanguageId()) {
      bibleData
        .loadBibleLanguage(preferred)
        .then(() => loadHarpaLanguageDeferred(preferred))
        .then(() => {
          notifyBibleLanguageChanged(preferred)
        })
        .catch((err) => {
          console.error('[biblia] Failed to restore Bible language:', err)
        })
    } else {
      void loadHarpaLanguageDeferred(preferred).catch((err) => {
        console.error('[harpa] Failed to sync Harpa language:', err)
      })
    }

    return () => {
      unsubscribe()
      window.removeEventListener(BIBLE_LANGUAGE_EVENT, handleLanguageEvent)
    }
  }, [])

  const changeLanguage = useCallback(
    async (id: BibleLanguageId): Promise<boolean> => {
      if (
        id === bibleData.getActiveLanguageId() &&
        id === (bibleStorage.getBibleLanguageId() ?? bibleData.getActiveLanguageId())
      )
        return true
      try {
        await bibleData.loadBibleLanguage(id)
        await loadHarpaLanguageDeferred(id)
        bibleStorage.setBibleLanguageId(id)
        notifyBibleLanguageChanged(id)
        return true
      } catch (err) {
        console.error('[biblia] Failed to load Bible language:', err)
        return false
      }
    },
    []
  )

  return { languageId, datasetVersion, changeLanguage }
}
