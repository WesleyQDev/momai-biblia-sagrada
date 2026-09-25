// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, act, within, cleanup } from '@testing-library/react'
import { RealisticBook } from '../src/components/RealisticBook'
import { bibleData } from '../src/services/bible-data'

// No vitest globals in this project, so RTL auto-cleanup is off: unmount
// between tests or portaled context menus leak into the next case.
afterEach(() => {
  cleanup()
  delete (window.navigator as unknown as { clipboard?: unknown }).clipboard
})

function renderBook() {
  const onToggleBookmark = vi.fn()
  const onCopyVerse = vi.fn()
  const book = bibleData.getBookById(43)!
  const { container } = render(
    <RealisticBook
      book={book}
      chapter={1}
      bookmarkedSet={new Set()}
      onToggleBookmark={onToggleBookmark}
      onCopyVerse={onCopyVerse}
      onNavigateChapter={() => {}}
      onOpenDrawer={() => {}}
      onBackToHome={() => {}}
    />
  )
  return { container, onToggleBookmark, onCopyVerse }
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80))
  })
}

function findVerseSpan(container: HTMLElement) {
  return container.querySelector('[data-verse="1"]') as HTMLElement | null
}

async function openMenuOnVerse(container: HTMLElement, plusRightClickAgain = false) {
  const verse = findVerseSpan(container)
  await act(async () => {
    fireEvent.contextMenu(verse!, { clientX: 200, clientY: 150 })
  })
  if (plusRightClickAgain) {
    await act(async () => {
      fireEvent.contextMenu(findVerseSpan(container)!, { clientX: 220, clientY: 160 })
    })
  }
  return document.querySelector('[role="menu"]') as HTMLElement
}

describe('Bible verse right-click context menu', () => {
  it('no longer opens the copy/bookmark card on left click', async () => {
    const { container } = renderBook()
    await settle()
    const verse = findVerseSpan(container)
    expect(verse).toBeTruthy()
    await act(async () => {
      fireEvent.click(verse!)
    })
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(container.querySelector('.animate-slide-in-up')).toBeNull()
  })

  it('soft-selects the verse and offers copy/bookmark/select-all on right click', async () => {
    const { container } = renderBook()
    await settle()
    const menu = await openMenuOnVerse(container)

    expect(menu).toBeTruthy()
    expect(menu.textContent).toContain('Copiar')
    expect(menu.textContent).toContain('Marcar')
    expect(menu.textContent).toContain('⭐')
    expect(menu.textContent).toContain('Selecionar tudo')

    const selected = container.querySelector('[data-context-selected="true"]')
    expect(selected).toBeTruthy()
    expect(selected!.textContent).toContain('princípio')
  })

  it('bookmarks the clicked verse from the menu and clears the selection', async () => {
    const { container, onToggleBookmark } = renderBook()
    await settle()
    const menu = await openMenuOnVerse(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Marcar'))
    })

    expect(onToggleBookmark).toHaveBeenCalledWith(
      expect.objectContaining({ bookId: 43, chapter: 1, verse: 1 })
    )
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(container.querySelector('[data-context-selected="true"]')).toBeNull()
  })

  it('copies the clicked verse from the menu', async () => {
    const { container, onCopyVerse } = renderBook()
    await settle()
    const menu = await openMenuOnVerse(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Copiar'))
    })

    expect(onCopyVerse).toHaveBeenCalledWith(expect.objectContaining({ verse: 1 }))
  })

  it('marks the whole page with the custom highlight, never the native selection', async () => {
    const { container } = renderBook()
    await settle()
    const menu = await openMenuOnVerse(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Selecionar tudo'))
    })

    const page = findVerseSpan(container)!.closest('[data-page-content]') as HTMLElement
    expect(page.className).not.toContain('select-text')
    expect(page.querySelectorAll('[data-page-selected="true"]').length).toBeGreaterThan(0)
    expect(window.getSelection()?.rangeCount ?? 0).toBe(0)

    const otherPages = Array.from(container.querySelectorAll('[data-page-content]')).filter(
      (el) => el !== page
    )
    otherPages.forEach((el) => {
      expect(el.querySelectorAll('[data-page-selected="true"]').length).toBe(0)
    })
  })

  it('offers only copy and select-all once the page is fully selected', async () => {
    const { container } = renderBook()
    await settle()
    const menu = await openMenuOnVerse(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Selecionar tudo'))
    })

    const menuAgain = await openMenuOnVerse(container, true)
    expect(menuAgain.textContent).toContain('Copiar')
    expect(menuAgain.textContent).toContain('Selecionar tudo')
    expect(menuAgain.textContent).not.toContain('Marcar')

    // The single-verse marking must not double up over the page highlight
    expect(findVerseSpan(container)!.getAttribute('data-context-selected')).toBeNull()
  })

  it('copies the whole page text when everything is selected', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    Object.defineProperty(window.navigator, 'clipboard', {
      value: clipboard,
      configurable: true
    })

    const { container } = renderBook()
    await settle()
    const menu = await openMenuOnVerse(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Selecionar tudo'))
    })

    const menuAgain = await openMenuOnVerse(container, true)
    await act(async () => {
      fireEvent.click(within(menuAgain).getByText('Copiar'))
    })

    expect(clipboard.writeText).toHaveBeenCalled()
    const copied = clipboard.writeText.mock.calls[0][0] as string
    expect(copied).toContain('princípio')
  })
})
