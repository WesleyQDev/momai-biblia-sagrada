// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import { BookStage } from '../src/components/book/BookStage'

afterEach(() => {
  cleanup()
  delete (HTMLElement.prototype as unknown as { clientWidth?: unknown }).clientWidth
  delete (HTMLElement.prototype as unknown as { clientHeight?: unknown }).clientHeight
})

function renderStage(onPaperLayout: (box: { width: number; height: number }) => void) {
  return render(
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
      onPaperLayout={onPaperLayout}
    />
  )
}

describe('BookStage paper measurement', () => {
  it('reports the real sheet width and height so the reader paginates against it', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 820
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 700
    })

    const onPaperLayout = vi.fn()
    await act(async () => {
      renderStage(onPaperLayout)
    })

    expect(onPaperLayout).toHaveBeenCalled()
    const box = onPaperLayout.mock.calls.at(-1)![0]
    expect(box.width).toBe(820)
    expect(box.height).toBe(700)
  })
})
