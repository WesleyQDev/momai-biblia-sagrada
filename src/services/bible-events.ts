import { executeBibleTool } from './worker-bridge'
import type { BibleVerse } from '../types/bible'

/**
 * Reports to the background worker that the devotional verse was shown in the
 * reader, so the "bible_daily_verse" automation event fires from the UI (and
 * not only when the AI calls get_random_verse).
 */
export function reportDailyVerseShown(verse: BibleVerse): void {
  if (!verse || !verse.text) return
  void executeBibleTool('report_daily_verse', {
    reference: `${verse.bookName} ${verse.chapter}:${verse.verse}`,
    text: verse.text,
    book: verse.bookName,
    chapter: verse.chapter,
    verse: verse.verse
  })
}
