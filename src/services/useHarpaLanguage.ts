import { useEffect, useState } from 'react'
import { harpaData } from './harpa-data'
import type { BibleLanguageId } from './bible-languages'

export function useHarpaLanguage() {
  const [languageId, setLanguageId] = useState<BibleLanguageId>(() =>
    harpaData.getActiveLanguageId()
  )
  const [datasetVersion, setDatasetVersion] = useState<number>(() =>
    harpaData.getDatasetVersion()
  )

  useEffect(() => {
    return harpaData.subscribe(() => {
      setLanguageId(harpaData.getActiveLanguageId())
      setDatasetVersion(harpaData.getDatasetVersion())
    })
  }, [])

  return { languageId, datasetVersion }
}
