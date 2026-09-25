// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { RealisticBook } from '../src/components/RealisticBook'
import { bibleData } from '../src/services/bible-data'

describe('RealisticBook does not yank the passage back on open', () => {
  it('opening Mateus 1 never reports Genesis back to the parent', async () => {
    const onNavigateChapter = vi.fn()
    const book = bibleData.getBookById(40)!
    render(
      <RealisticBook
        book={book}
        chapter={1}
        bookmarkedSet={new Set()}
        onToggleBookmark={() => {}}
        onCopyVerse={() => {}}
        onNavigateChapter={onNavigateChapter}
        onOpenDrawer={() => {}}
        onBackToHome={() => {}}
      />
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })
    // The stale initial spread (Genesis) must not pull the parent away
    // from the requested Mateus 1 — that ping-pong is the infinite loop.
    const yanked = onNavigateChapter.mock.calls.some(([bookId]) => bookId !== 40)
    expect(yanked).toBe(false)
  })

  it('opening Atos 13 stays on Atos 13 and does not retrocede to Atos 12', async () => {
    const onNavigateChapter = vi.fn()
    const book = bibleData.getBookById(44)! // Atos
    const { container } = render(
      <RealisticBook
        book={book}
        chapter={13}
        bookmarkedSet={new Set()}
        onToggleBookmark={() => {}}
        onCopyVerse={() => {}}
        onNavigateChapter={onNavigateChapter}
        onOpenDrawer={() => {}}
        onBackToHome={() => {}}
      />
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    // The visible spread must contain Atos 13
    expect(container.textContent).toContain('Antioquia')
    // Must never report chapter 12 back
    const reportedChapter12 = onNavigateChapter.mock.calls.some(([, chapter]) => chapter === 12)
    expect(reportedChapter12).toBe(false)
  })
})
