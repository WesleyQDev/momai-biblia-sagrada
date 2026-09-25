// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import { RealisticBook } from '../src/components/RealisticBook'
import { bibleData } from '../src/services/bible-data'

afterEach(cleanup)

function renderBook() {
  const book = bibleData.getBookById(43)!
  const { container } = render(
    <RealisticBook
      book={book}
      chapter={1}
      bookmarkedSet={new Set()}
      onToggleBookmark={() => {}}
      onCopyVerse={() => {}}
      onNavigateChapter={() => {}}
      onOpenDrawer={() => {}}
      onBackToHome={() => {}}
    />
  )
  return { container }
}

async function settle(ms = 100) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

function findVerse(container: HTMLElement) {
  return container.querySelector('[data-verse="1"]') as HTMLElement
}

describe('Bible drag starts anywhere on the sheet, including over the text', () => {
  it('turns the page when the drag starts on a verse', async () => {
    const { container } = renderBook()
    await settle()
    const before = container.textContent

    await act(async () => {
      fireEvent.mouseDown(findVerse(container), { clientX: 200 })
      fireEvent.mouseMove(window, { clientX: -80 })
      fireEvent.mouseUp(window, {})
      await new Promise((resolve) => setTimeout(resolve, 700))
    })

    expect(container.textContent).not.toBe(before)
  })

  it('does not turn the page on a plain click over a verse', async () => {
    const { container } = renderBook()
    await settle()
    const before = container.textContent

    await act(async () => {
      fireEvent.mouseDown(findVerse(container), { clientX: 200 })
      fireEvent.mouseUp(window, {})
      await new Promise((resolve) => setTimeout(resolve, 700))
    })

    expect(container.textContent).toBe(before)
  })

  it('still drags after a gesture that lost focus mid-drag', async () => {
    const { container } = renderBook()
    await settle()

    // Press and move a little, then the window loses focus before mouseup —
    // exactly what happens when the pointer is released outside the window.
    await act(async () => {
      fireEvent.mouseDown(findVerse(container), { clientX: 200 })
      fireEvent.mouseMove(window, { clientX: 190 })
    })
    await act(async () => {
      fireEvent.blur(window)
      await new Promise((resolve) => setTimeout(resolve, 600))
    })

    const before = container.textContent
    await act(async () => {
      fireEvent.mouseDown(findVerse(container), { clientX: 200 })
      fireEvent.mouseMove(window, { clientX: -80 })
      fireEvent.mouseUp(window, {})
      await new Promise((resolve) => setTimeout(resolve, 700))
    })

    expect(container.textContent).not.toBe(before)
  })
})
