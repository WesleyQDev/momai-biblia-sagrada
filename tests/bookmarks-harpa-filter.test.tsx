// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BookmarksView } from '../src/components/BookmarksView'

function renderBookmarks(favoriteHymns: number[]) {
  const { container } = render(
    <BookmarksView
      onNavigateToPassage={() => {}}
      onStartReading={() => {}}
      favoriteHymns={favoriteHymns}
      onNavigateToHymn={() => {}}
      onRemoveHymnFavorite={() => {}}
    />
  )
  return { container }
}

describe('Bookmarks filter includes Harpa', () => {
  it('offers a Harpa filter and shows only the hymns when selected', () => {
    const { container } = renderBookmarks([500])
    const harpaBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Harpa'
    )
    expect(harpaBtn).toBeTruthy()
    fireEvent.click(harpaBtn!)
    const text = container.textContent || ''
    expect(text).toContain('Quero ver a Jesus Cristo')
    expect(text).not.toContain('Nenhum marcador encontrado')
  })

  it('hides the hymn favorites when a testament filter is active', () => {
    const { container } = renderBookmarks([500])
    const antigoBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Antigo'
    )
    expect(antigoBtn).toBeTruthy()
    fireEvent.click(antigoBtn!)
    expect(container.textContent || '').not.toContain('Hinos favoritos')
  })
})
