// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { VerseCard } from '../src/components/VerseCard'
import type { BibleVerse } from '../src/types/bible'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const mockVerse: BibleVerse = {
  id: 1001001,
  bookId: 1,
  bookName: 'Gênesis',
  bookAbbrev: 'gn',
  testament: 'VT',
  chapter: 1,
  verse: 1,
  text: 'No princípio, criou Deus os céus e a terra.'
}

describe('VerseCard text selection vs navigation', () => {
  it('navigates on a clean single click without text selection', () => {
    const onNavigate = vi.fn()
    const onRefresh = vi.fn()
    const { container } = render(
      <VerseCard verse={mockVerse} onNavigate={onNavigate} onRefresh={onRefresh} />
    )

    const card = container.firstElementChild as HTMLElement
    fireEvent.mouseDown(card, { clientX: 100, clientY: 100 })
    fireEvent.click(card, { clientX: 100, clientY: 100 })

    expect(onNavigate).toHaveBeenCalledWith(mockVerse)
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('does not navigate when text is selected in the window', () => {
    const onNavigate = vi.fn()
    const onRefresh = vi.fn()
    const { container } = render(
      <VerseCard verse={mockVerse} onNavigate={onNavigate} onRefresh={onRefresh} />
    )

    vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => 'No princípio',
      isCollapsed: false
    } as unknown as Selection)

    const card = container.firstElementChild as HTMLElement
    fireEvent.mouseDown(card, { clientX: 100, clientY: 100 })
    fireEvent.click(card, { clientX: 100, clientY: 100 })

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate when mouse was dragged during selection', () => {
    const onNavigate = vi.fn()
    const onRefresh = vi.fn()
    const { container } = render(
      <VerseCard verse={mockVerse} onNavigate={onNavigate} onRefresh={onRefresh} />
    )

    const card = container.firstElementChild as HTMLElement
    fireEvent.mouseDown(card, { clientX: 100, clientY: 100 })
    fireEvent.click(card, { clientX: 250, clientY: 100 })

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('triggers refresh button without navigating', () => {
    const onNavigate = vi.fn()
    const onRefresh = vi.fn()
    const { container } = render(
      <VerseCard verse={mockVerse} onNavigate={onNavigate} onRefresh={onRefresh} />
    )

    const button = container.querySelector('button') as HTMLButtonElement
    fireEvent.click(button)

    expect(onRefresh).toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
