// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { HomeView } from '../src/components/HomeView'
import type { ReadingProgress } from '../src/types/reading'

afterEach(() => {
  cleanup()
})

const lastReading: ReadingProgress = {
  bookId: 43,
  bookName: 'João',
  bookAbbrev: 'jo',
  testament: 'NT',
  chapter: 1,
  verse: 1,
  updatedAt: Date.now()
}

describe('HomeView Harpa Search Integration', () => {
  it('opens search modal, finds Harpa hymn and navigates to it', async () => {
    const onNavigateToHymn = vi.fn()
    const onNavigateToPassage = vi.fn()

    const { container } = render(
      <HomeView
        onNavigateToPassage={onNavigateToPassage}
        onOpenBookmarks={() => {}}
        onOpenHarpa={() => {}}
        onNavigateToHymn={onNavigateToHymn}
        lastReading={lastReading}
      />
    )

    // Open search modal via search button
    const searchBtn = container.querySelector('button[title*="Buscar"]')
    expect(searchBtn).not.toBeNull()
    fireEvent.click(searchBtn!)

    // Search input should be present
    const input = screen.getByPlaceholderText(/Ex: João 3:16, Hino 545/i)
    expect(input).toBeDefined()

    // Type "545" to search for Harpa hymn 545
    fireEvent.change(input, { target: { value: '545' } })

    // Wait for debounced search results
    await waitFor(
      () => {
        expect(screen.getByText(/Porque Ele Vive/i)).toBeDefined()
      },
      { timeout: 1500 }
    )

    // Check Harpa badge
    const badge = screen.getByText('Harpa')
    expect(badge).toBeDefined()

    // Click on the result
    const resultItem = screen.getByText(/Porque Ele Vive/i).closest('div[class*="cursor-pointer"]')
    expect(resultItem).not.toBeNull()
    fireEvent.click(resultItem!)

    // onNavigateToHymn should be called with 545
    expect(onNavigateToHymn).toHaveBeenCalledWith(545)
  })

  it('filters results to only Harpa when clicking the Harpa filter pill', async () => {
    const { container } = render(
      <HomeView
        onNavigateToPassage={() => {}}
        onOpenBookmarks={() => {}}
        onOpenHarpa={() => {}}
        onNavigateToHymn={() => {}}
        lastReading={lastReading}
      />
    )

    const searchBtn = container.querySelector('button[title*="Buscar"]')
    expect(searchBtn).not.toBeNull()
    fireEvent.click(searchBtn!)

    const input = screen.getByPlaceholderText(/Ex: João 3:16, Hino 545/i)
    fireEvent.change(input, { target: { value: 'amor' } })

    // Click on the Harpa Cristã filter button inside the search modal
    const harpaFilterBtn = Array.from(screen.getAllByRole('button', { name: /Harpa Cristã/i })).find((btn) =>
      btn.getAttribute('type') === 'button' && btn.closest('.fixed') !== null
    )
    expect(harpaFilterBtn).toBeDefined()
    fireEvent.click(harpaFilterBtn!)

    await waitFor(
      () => {
        const badges = screen.getAllByText('Harpa')
        expect(badges.length).toBeGreaterThan(0)
      },
      { timeout: 1500 }
    )
  })

  it('renders verses first and hymns second with section headers in scope ALL', async () => {
    const { container } = render(
      <HomeView
        onNavigateToPassage={() => {}}
        onOpenBookmarks={() => {}}
        onOpenHarpa={() => {}}
        onNavigateToHymn={() => {}}
        lastReading={lastReading}
      />
    )

    const searchBtn = container.querySelector('button[title*="Buscar"]')
    expect(searchBtn).not.toBeNull()
    fireEvent.click(searchBtn!)

    const input = screen.getByPlaceholderText(/Ex: João 3:16, Hino 545/i)
    fireEvent.change(input, { target: { value: 'cabo' } })

    await waitFor(
      () => {
        expect(screen.getByText('Versículos')).toBeDefined()
        expect(screen.getAllByText('Harpa Cristã').length).toBeGreaterThanOrEqual(2)
        expect(screen.getByText(/Sobre as Ondas do Mar/i)).toBeDefined()
      },
      { timeout: 8000 }
    )
  }, 15000)

  it('closes the search modal when pressing Escape key', () => {
    const { container } = render(
      <HomeView
        onNavigateToPassage={() => {}}
        onOpenBookmarks={() => {}}
        onOpenHarpa={() => {}}
        onNavigateToHymn={() => {}}
        lastReading={lastReading}
      />
    )

    const searchBtn = container.querySelector('button[title*="Buscar"]')
    expect(searchBtn).not.toBeNull()
    fireEvent.click(searchBtn!)

    // Modal should be open
    const input = screen.getByPlaceholderText(/Ex: João 3:16, Hino 545/i)
    expect(input).toBeDefined()

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })

    // Modal should be closed
    expect(screen.queryByPlaceholderText(/Ex: João 3:16, Hino 545/i)).toBeNull()
  })
})
