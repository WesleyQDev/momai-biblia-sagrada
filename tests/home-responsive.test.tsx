// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HomeView } from '../src/components/HomeView'
import type { ReadingProgress } from '../src/types/reading'

const lastReading: ReadingProgress = {
  bookId: 43,
  bookName: 'João',
  bookAbbrev: 'jo',
  testament: 'NT',
  chapter: 1,
  verse: 1,
  updatedAt: Date.now()
}

function renderHome() {
  return render(
    <HomeView
      onNavigateToPassage={() => {}}
      onOpenBookmarks={() => {}}
      onOpenHarpa={() => {}}
      lastReading={lastReading}
    />
  )
}

describe('Home screen fits the window without scrolling', () => {
  it('sizes itself from the container height instead of a viewport calc', () => {
    const { container } = renderHome()
    const root = container.firstElementChild as HTMLElement
    expect(root.className).not.toContain('100vh')
    expect(root.className).toContain('flex-1')
    expect(root.className).toContain('min-h-0')
    expect(root.className).toContain('justify-between')
  })

  it('scales the title, icon boxes and labels with the window height', () => {
    const { container } = renderHome()

    const title = container.querySelector('h1') as HTMLElement
    expect(title.style.fontSize).toContain('clamp(')

    const iconBoxes = Array.from(container.querySelectorAll('div')).filter((el) =>
      (el.style.width || '').includes('clamp(')
    )
    expect(iconBoxes.length).toBeGreaterThanOrEqual(5)

    const labels = ['Novo testamento', 'Velho Testamento', 'Harpa Cristã', 'Marcadores', 'Continuar leitura']
    labels.forEach((text) => {
      const label = Array.from(container.querySelectorAll('span')).find(
        (span) => span.textContent === text
      )
      expect(label, `label ${text}`).toBeTruthy()
      expect(label!.style.fontSize, `label ${text}`).toContain('clamp(')
    })
  })

  it('keeps the random verse and its reference readable at every height', () => {
    const { container } = renderHome()
    const verse = Array.from(container.querySelectorAll('p')).find((p) =>
      (p.textContent || '').startsWith('"')
    ) as HTMLElement
    expect(verse).toBeTruthy()
    expect(verse.style.fontSize).toContain('clamp(')

    const reference = Array.from(container.querySelectorAll('span')).find((s) =>
      (s.textContent || '').includes(' : ')
    ) as HTMLElement
    expect(reference).toBeTruthy()
    expect(reference.style.fontSize).toContain('clamp(')
  })
})
