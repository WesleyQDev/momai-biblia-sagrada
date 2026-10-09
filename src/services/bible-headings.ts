import ptHeadings from '../../assets/bible/headings/pt-BR.json'
import enHeadings from '../../assets/bible/headings/en-US.json'
import esHeadings from '../../assets/bible/headings/es.json'
import frHeadings from '../../assets/bible/headings/fr.json'
import deHeadings from '../../assets/bible/headings/de.json'
import itHeadings from '../../assets/bible/headings/it.json'
import type { BibleLanguageId } from './bible-languages'

const headingDatasets: Record<BibleLanguageId, Record<string, string>> = {
  'pt-BR': ptHeadings as Record<string, string>,
  'en-US': enHeadings as Record<string, string>,
  'es': esHeadings as Record<string, string>,
  'fr': frHeadings as Record<string, string>,
  'de': deHeadings as Record<string, string>,
  'it': itHeadings as Record<string, string>
}

// `${bookId}-${chapter}` -> verse -> heading. Built once per language so the
// full-Bible pagination no longer scans every heading entry per chapter.
type ChapterHeadings = Map<string, Map<number, string>>
const indexCache = new Map<BibleLanguageId, ChapterHeadings>()

function buildIndex(dataset: Record<string, string>): ChapterHeadings {
  const index: ChapterHeadings = new Map()
  for (const [key, text] of Object.entries(dataset)) {
    const separator = key.lastIndexOf('-')
    if (separator <= 0) continue
    const chapterKey = key.slice(0, separator)
    const verse = parseInt(key.slice(separator + 1), 10)
    if (isNaN(verse)) continue
    let chapterMap = index.get(chapterKey)
    if (!chapterMap) {
      chapterMap = new Map()
      index.set(chapterKey, chapterMap)
    }
    chapterMap.set(verse, text)
  }
  return index
}

function getIndex(languageId: BibleLanguageId): ChapterHeadings {
  const cached = indexCache.get(languageId)
  if (cached) return cached
  const index = buildIndex(headingDatasets[languageId] || headingDatasets['pt-BR'])
  indexCache.set(languageId, index)
  return index
}

export const bibleHeadings = {
  getHeading(
    languageId: BibleLanguageId,
    bookId: number,
    chapter: number,
    verse: number
  ): string | undefined {
    const key = `${bookId}-${chapter}`
    return (
      getIndex(languageId).get(key)?.get(verse) ??
      getIndex('pt-BR').get(key)?.get(verse)
    )
  },

  getChapterHeadings(
    languageId: BibleLanguageId,
    bookId: number,
    chapter: number
  ): Map<number, string> {
    const key = `${bookId}-${chapter}`
    const current = getIndex(languageId).get(key)
    const result = new Map(current ?? [])
    if (languageId !== 'pt-BR') {
      const fallback = getIndex('pt-BR').get(key)
      if (fallback) {
        for (const [verse, text] of fallback) {
          if (!result.has(verse)) result.set(verse, text)
        }
      }
    }
    return result
  }
}
