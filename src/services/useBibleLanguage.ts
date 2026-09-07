import { useCallback, useEffect, useState } from 'react'
import { bibleData } from './bible-data'
import { bibleStorage } from './storage'
import { notifyBibleLanguageChanged, type BibleLanguageId } from './bible-languages'

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

    const preferred = bibleStorage.getBibleLanguageId()
    if (preferred && preferred !== bibleData.getActiveLanguageId()) {
      bibleData
        .loadBibleLanguage(preferred)
        .then(() => {
          notifyBibleLanguageChanged(preferred)
        })
        .catch((err) => {
          console.error('[biblia] Failed to restore Bible language:', err)
        })
    }

    return unsubscribe
  }, [])

  const changeLanguage = useCallback(
    async (id: BibleLanguageId): Promise<boolean> => {
      if (id === bibleData.getActiveLanguageId()) return true
      try {
        await bibleData.loadBibleLanguage(id)
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
