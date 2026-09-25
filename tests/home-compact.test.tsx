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

describe('Home icon grid stays compact', () => {
  it('width-hugs the icons instead of stretching across the page', () => {
    const { container } = renderHome()
    const harpaBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      (b.textContent || '').includes('Harpa')
    )
    const section = harpaBtn!.closest('section') as HTMLElement
    expect(section).toBeTruthy()
    expect(section.className).toMatch(/\bw-fit\b|\bmax-w-xs\b/)
  })

  it('renders the harp icon without a circle behind it', () => {
    const { container } = renderHome()
    const harpaBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      (b.textContent || '').includes('Harpa')
    )
    expect(harpaBtn!.querySelector('.rounded-full')).toBeNull()
  })
})
