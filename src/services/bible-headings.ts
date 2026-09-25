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

export const bibleHeadings = {
  getHeading(
    languageId: BibleLanguageId,
    bookId: number,
    chapter: number,
    verse: number
  ): string | undefined {
    const key = `${bookId}-${chapter}-${verse}`
    const currentDataset = headingDatasets[languageId] || headingDatasets['pt-BR']
    return currentDataset[key] || headingDatasets['pt-BR'][key]
  },

  getChapterHeadings(
    languageId: BibleLanguageId,
    bookId: number,
    chapter: number
  ): Map<number, string> {
    const map = new Map<number, string>()
    const prefix = `${bookId}-${chapter}-`
    const currentDataset = headingDatasets[languageId] || headingDatasets['pt-BR']
    const fallbackDataset = headingDatasets['pt-BR']

    for (const [key, text] of Object.entries(currentDataset)) {
      if (key.startsWith(prefix)) {
        const verse = parseInt(key.slice(prefix.length), 10)
        if (!isNaN(verse)) {
          map.set(verse, text)
        }
      }
    }

    if (currentDataset !== fallbackDataset) {
      for (const [key, text] of Object.entries(fallbackDataset)) {
        if (key.startsWith(prefix)) {
          const verse = parseInt(key.slice(prefix.length), 10)
          if (!isNaN(verse) && !map.has(verse)) {
            map.set(verse, text)
          }
        }
      }
    }

    return map
  }
}
