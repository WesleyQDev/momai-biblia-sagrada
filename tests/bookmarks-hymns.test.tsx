// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BookmarksView } from '../src/components/BookmarksView'

function renderBookmarks(favoriteHymns: number[]) {
  const onNavigateToHymn = vi.fn()
  const onRemoveHymnFavorite = vi.fn()
  const { container, unmount } = render(
    <BookmarksView
      onNavigateToPassage={() => {}}
      onStartReading={() => {}}
      favoriteHymns={favoriteHymns}
      onNavigateToHymn={onNavigateToHymn}
      onRemoveHymnFavorite={onRemoveHymnFavorite}
    />
  )
  return { container, onNavigateToHymn, onRemoveHymnFavorite, unmount }
}

describe('Hymn favorites appear in the bookmarks tab', () => {
  it('lists favorite hymns with number and title', () => {
    const { container } = renderBookmarks([500, 1])
    const text = container.textContent || ''
    expect(text).toContain('Hinos favoritos')
    expect(text).toContain('Quero ver a Jesus Cristo')
    expect(text).toContain('Chuvas de Graça')
  })

  it('navigates to the hymn when its row is clicked', () => {
    const { container, onNavigateToHymn } = renderBookmarks([500])
    const row = Array.from(container.querySelectorAll('div')).find(
      (el) => el.className.includes('cursor-pointer') && el.textContent?.includes('Quero ver a Jesus Cristo')
    )
    expect(row).toBeTruthy()
    fireEvent.click(row!)
    expect(onNavigateToHymn).toHaveBeenCalledWith(500)
  })

  it('removes a hymn favorite from its row button without navigating', () => {
    const { container, onNavigateToHymn, onRemoveHymnFavorite } = renderBookmarks([500])
    const removeBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.getAttribute('title') === 'Remover hino dos favoritos'
    )
    expect(removeBtn).toBeTruthy()
    fireEvent.click(removeBtn!)
    expect(onRemoveHymnFavorite).toHaveBeenCalledWith(500)
    expect(onNavigateToHymn).not.toHaveBeenCalled()
  })

  it('shows the empty hint when there are no favorite hymns', () => {
    const { container } = renderBookmarks([])
    expect(container.textContent || '').toContain('Nenhum hino favoritado ainda')
  })
})
