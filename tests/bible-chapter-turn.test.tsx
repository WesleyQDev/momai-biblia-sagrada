// @vitest-environment jsdom
import React, { useState } from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { RealisticBook } from '../src/components/RealisticBook'
import { bibleData } from '../src/services/bible-data'

afterEach(cleanup)

// Mirrors the real page: navigation notifications from the book update the
// parent state, which flows back down as new book/chapter props.
const Harness: React.FC = () => {
  const [passage, setPassage] = useState({ bookId: 43, chapter: 21 })
  const book = bibleData.getBookById(passage.bookId)!
  return (
    <RealisticBook
      book={book}
      chapter={passage.chapter}
      bookmarkedSet={new Set()}
      onToggleBookmark={() => {}}
      onCopyVerse={() => {}}
      onNavigateChapter={(bookId, chapter) => setPassage({ bookId, chapter })}
      onOpenDrawer={() => {}}
      onBackToHome={() => {}}
    />
  )
}

async function flipForward(container: HTMLElement) {
  const verse = container.querySelector('[data-verse]') as HTMLElement
  await act(async () => {
    fireEvent.mouseDown(verse, { clientX: 200 })
    fireEvent.mouseMove(window, { clientX: -80 })
    fireEvent.mouseUp(window, {})
    await new Promise((resolve) => setTimeout(resolve, 650))
  })
}

describe('Bible page turns across chapter and book boundaries', () => {
  it(
    'never rewinds a spread when the chapter change is echoed back',
    async () => {
      const { container } = render(<Harness />)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 120))
      })

      // Starting at João 21 (end of the book), a few flips cross into Atos 1
      let previous = container.textContent
      for (let i = 0; i < 5; i++) {
        await flipForward(container)
        const current = container.textContent
        expect(current, `flip ${i + 1} must advance, not rewind`).not.toBe(previous)
        previous = current
      }
    },
    30000
  )
})
