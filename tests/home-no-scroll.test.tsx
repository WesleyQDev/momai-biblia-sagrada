// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { HomeView } from '../src/components/HomeView'
import { BiblePage } from '../src/page'
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

function parseClampMinPx(value: string): number | null {
  const match = value.match(/clamp\(\s*([\d.]+)rem/i)
  if (!match) return null
  return parseFloat(match[1]) * 16
}

describe('Home fits without scrolling', () => {
  it('never offers vertical scrolling on the home layer', () => {
    const { container } = render(<BiblePage isActive locale="pt-BR" />)
    const layer = container.querySelector('[data-page-layer]') as HTMLElement
    expect(layer).toBeTruthy()
    expect(layer.className).not.toContain('overflow-y-auto')
    expect(layer.className).toContain('overflow-hidden')
  })

  it('keeps the home container inside its bounds with fluid gaps', () => {
    const { container } = renderHome()
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('overflow-hidden')
    expect(root.className).not.toContain('space-y-4')
    expect(root.className).not.toContain('overflow-y-auto')
    const gap = root.style.gap || ''
    expect(gap).toContain('clamp(')
  })

  it('shrinks type and icons enough to fit short windows while staying legible', () => {
    const { container } = renderHome()
    const title = container.querySelector('h1') as HTMLElement
    const titleMin = parseClampMinPx(title.style.fontSize || '')
    expect(titleMin).not.toBeNull()
    expect(titleMin!).toBeLessThanOrEqual(20)
    expect(titleMin!).toBeGreaterThanOrEqual(16)

    const iconBoxes = Array.from(container.querySelectorAll('div')).filter((el) =>
      ((el as HTMLElement).style.width || '').includes('clamp(')
    ) as HTMLElement[]
    expect(iconBoxes.length).toBeGreaterThanOrEqual(5)
    iconBoxes.forEach((box) => {
      const min = parseClampMinPx(box.style.width || '')
      expect(min).not.toBeNull()
      expect(min!).toBeLessThanOrEqual(44)
    })

    const labels = Array.from(container.querySelectorAll('span')).filter((span) =>
      ['Novo testamento', 'Velho Testamento', 'Harpa Cristã', 'Marcadores', 'Continuar leitura'].includes(
        span.textContent || ''
      )
    ) as HTMLElement[]
    expect(labels.length).toBe(5)
    labels.forEach((label) => {
      const min = parseClampMinPx(label.style.fontSize || '')
      expect(min).not.toBeNull()
      expect(min!).toBeLessThanOrEqual(13)
    })
  })
})
