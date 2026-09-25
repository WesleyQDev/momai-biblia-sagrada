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

describe('Harpa centered among the 4 home icons', () => {
  it('places Harpa in the middle row without purge-sensitive grid classes', () => {
    const { container } = render(
      <HomeView
        onNavigateToPassage={() => {}}
        onOpenBookmarks={() => {}}
        onOpenHarpa={() => {}}
        lastReading={lastReading}
      />
    )
    const harpaBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      (b.textContent || '').includes('Harpa')
    )
    expect(harpaBtn).toBeTruthy()
    expect(harpaBtn!.className.includes('col-start-')).toBe(false)
    const style = harpaBtn!.style
    expect(style.gridColumnStart).toBe('2')
    expect(style.gridRowStart).toBe('2')
  })
})
