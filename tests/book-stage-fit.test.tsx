// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BookStage } from '../src/components/book/BookStage'

function renderStage() {
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
    />
  )
}

describe('BookStage sizes from its container, not the viewport', () => {
  it('never uses h-screen on the stage root', () => {
    const { container } = renderStage()
    const root = container.firstElementChild as HTMLElement
    expect(root.className).not.toMatch(/\bh-screen\b/)
    expect(root.className).not.toMatch(/\bmax-h-screen\b/)
    expect(root.className).toMatch(/\bmin-h-0\b/)
    expect(root.className).toMatch(/\bflex-1\b/)
  })

  it('never sizes the paper with 100vh so the bottom border stays visible', () => {
    const { container } = renderStage()
    expect(container.innerHTML).not.toContain('100vh')
  })
})
