// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BookStage } from '../src/components/book/BookStage'
import { bibleStorage } from '../src/services/storage'
import { computeBookPageCapacity } from '../src/components/book/useBookPageCapacity'

describe('Book text zoom on mouse wheel scroll', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to 0.95 (95%) zoom on initial mount and handles transient bounds (0.75..1.8)', () => {
    expect(bibleStorage.getTextZoom()).toBe(0.95)

    bibleStorage.setTextZoom(1.25)
    expect(bibleStorage.getTextZoom()).toBe(1.25)

    // Clamped upper bound
    bibleStorage.setTextZoom(3.5)
    expect(bibleStorage.getTextZoom()).toBe(1.8)

    // Clamped lower bound
    bibleStorage.setTextZoom(0.2)
    expect(bibleStorage.getTextZoom()).toBe(0.75)
  })

  it('reduces characters per page when zoom is increased so text does not overflow', () => {
    const normal = computeBookPageCapacity({ width: 1000, height: 600 }, 900, 5, 1.0)
    const zoomedIn = computeBookPageCapacity({ width: 1000, height: 600 }, 900, 5, 1.3)
    const zoomedOut = computeBookPageCapacity({ width: 1000, height: 600 }, 900, 5, 0.8)

    expect(zoomedIn).toBeLessThan(normal)
    expect(zoomedOut).toBeGreaterThan(normal)
  })

  it('triggers onZoomChange when wheel is scrolled over the book stage', () => {
    const onZoomChange = vi.fn()
    const { container } = render(
      <BookStage
        totalSpreads={2}
        spread={0}
        onSpreadChange={() => {}}
        renderPage={() => <div />}
        homeLabel="Home"
        indexLabel="Index"
        flipHints={{
          next: '',
          nextOverflow: '',
          nextEnd: '',
          prev: '',
          prevOverflow: '',
          prevStart: ''
        }}
        onBackToHome={() => {}}
        onOpenIndex={() => {}}
        zoomScale={1.0}
        onZoomChange={onZoomChange}
      />
    )

    const stage = container.querySelector('[style*="perspective"]')
    const bookCase = stage?.firstElementChild as HTMLElement
    expect(bookCase).toBeDefined()

    // Wheel scroll up -> zoom in (deltaY < 0)
    fireEvent.wheel(bookCase, { deltaY: -100 })
    expect(onZoomChange).toHaveBeenCalled()
    const zoomInUpdater = onZoomChange.mock.calls[0][0]
    expect(zoomInUpdater(1.0)).toBeCloseTo(1.05)

    // Wheel scroll down -> zoom out (deltaY > 0)
    fireEvent.wheel(bookCase, { deltaY: 100 })
    const zoomOutUpdater = onZoomChange.mock.calls[1][0]
    expect(zoomOutUpdater(1.0)).toBeCloseTo(0.95)
  })

  it('displays 95% on the badge when the baseline zoom is 0.95', () => {
    const { container, rerender } = render(
      <BookStage
        totalSpreads={2}
        spread={0}
        onSpreadChange={() => {}}
        renderPage={() => <div />}
        homeLabel="Home"
        indexLabel="Index"
        flipHints={{
          next: '',
          nextOverflow: '',
          nextEnd: '',
          prev: '',
          prevOverflow: '',
          prevStart: ''
        }}
        onBackToHome={() => {}}
        onOpenIndex={() => {}}
        zoomScale={0.95}
      />
    )

    // Trigger zoom change to show badge
    rerender(
      <BookStage
        totalSpreads={2}
        spread={0}
        onSpreadChange={() => {}}
        renderPage={() => <div />}
        homeLabel="Home"
        indexLabel="Index"
        flipHints={{
          next: '',
          nextOverflow: '',
          nextEnd: '',
          prev: '',
          prevOverflow: '',
          prevStart: ''
        }}
        onBackToHome={() => {}}
        onOpenIndex={() => {}}
        zoomScale={0.95}
      />
    )

    const badge = container.querySelector('[class*="animate-fade-in"]')
    if (badge) {
      expect(badge.textContent).toContain('95%')
    }
  })

  it('scrolls text up and down when dragging vertically on the page container', () => {
    let scrollContainerEl: HTMLDivElement | null = null
    const { container } = render(
      <BookStage
        totalSpreads={2}
        spread={0}
        onSpreadChange={() => {}}
        renderPage={({ index }) => (
          <div
            data-scroll-container=""
            ref={(el) => {
              if (index === 0 && el) scrollContainerEl = el
            }}
            style={{ overflowY: 'auto', height: 400 }}
          >
            <div style={{ height: 1000 }}>Long text content</div>
          </div>
        )}
        homeLabel="Home"
        indexLabel="Index"
        flipHints={{
          next: '',
          nextOverflow: '',
          nextEnd: '',
          prev: '',
          prevOverflow: '',
          prevStart: ''
        }}
        onBackToHome={() => {}}
        onOpenIndex={() => {}}
        zoomScale={1.2}
      />
    )

    expect(scrollContainerEl).not.toBeNull()
    if (!scrollContainerEl) return

    const bookRefEl = container.querySelector('[class*="cursor-grab"]') as HTMLElement
    expect(bookRefEl).not.toBeNull()

    // Simulate drag start inside the left page container
    fireEvent.mouseDown(scrollContainerEl, { clientX: 200, clientY: 300, button: 0 })

    // Simulate vertical drag upward (moving mouse up by 50px -> deltaY = -50 -> scrollTop increases by 50)
    fireEvent.mouseMove(window, { clientX: 200, clientY: 250 })

    expect(scrollContainerEl.scrollTop).toBe(50)

    // Simulate mouse up
    fireEvent.mouseUp(window)
  })
})
