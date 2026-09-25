// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, act, within, cleanup } from '@testing-library/react'
import { HarpaBook } from '../src/components/HarpaBook'

// No vitest globals in this project, so RTL auto-cleanup is off: unmount
// between tests or portaled context menus leak into the next case.
afterEach(cleanup)

function renderHarpa() {
  const onToggleFavorite = vi.fn()
  const onCopyHymn = vi.fn()
  const onNavigateHymn = vi.fn()
  const { container } = render(
    <HarpaBook
      hymnNumber={1}
      favoriteNumbers={new Set()}
      onNavigateHymn={onNavigateHymn}
      onToggleFavorite={onToggleFavorite}
      onCopyHymn={onCopyHymn}
      onOpenDrawer={() => {}}
      onBackToHome={() => {}}
    />
  )
  return { container, onToggleFavorite, onCopyHymn, onNavigateHymn }
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80))
  })
}

function findStanza(container: HTMLElement) {
  return Array.from(container.querySelectorAll('div.break-inside-avoid')).find((el) =>
    el.textContent?.includes('Deus prometeu com certeza')
  ) as HTMLElement | undefined
}

async function openMenuOnStanza(container: HTMLElement, again = false) {
  await act(async () => {
    fireEvent.contextMenu(findStanza(container)!, { clientX: 200, clientY: 150 })
  })
  if (again) {
    await act(async () => {
      fireEvent.contextMenu(findStanza(container)!, { clientX: 220, clientY: 160 })
    })
  }
  return document.querySelector('[role="menu"]') as HTMLElement
}

describe('Harpa hymn right-click context menu', () => {
  it('no longer opens the copy/favorite card on left click', async () => {
    const { container } = renderHarpa()
    await settle()
    const stanza = findStanza(container)
    expect(stanza).toBeTruthy()
    await act(async () => {
      fireEvent.click(stanza!)
    })
    expect(document.querySelector('[role="menu"]')).toBeNull()
    expect(container.querySelector('.animate-slide-in-up')).toBeNull()
  })

  it('offers copy/marker/select-all without highlighting the paragraph', async () => {
    const { container } = renderHarpa()
    await settle()
    const menu = await openMenuOnStanza(container)

    expect(menu.textContent).toContain('Copiar')
    expect(menu.textContent).toContain('Marcador')
    expect(menu.textContent).toContain('⭐')
    expect(menu.textContent).toContain('Selecionar tudo')

    // The marker bookmarks the hymn, so no paragraph selection appears
    expect(container.querySelectorAll('[data-context-selected="true"]').length).toBe(0)
  })

  it('marks the clicked hymn from the menu and closes it', async () => {
    const { container, onToggleFavorite } = renderHarpa()
    await settle()
    const menu = await openMenuOnStanza(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Marcador'))
    })

    expect(onToggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ number: 1 }))
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })

  it('marks the whole page with the custom highlight, never the native selection', async () => {
    const { container } = renderHarpa()
    await settle()
    const menu = await openMenuOnStanza(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Selecionar tudo'))
    })

    const page = findStanza(container)!.closest('[data-harpa-content]') as HTMLElement
    expect(page.className).not.toContain('select-text')
    expect(page.querySelectorAll('[data-page-selected="true"]').length).toBeGreaterThan(0)
    expect(window.getSelection()?.rangeCount ?? 0).toBe(0)

    const otherPages = Array.from(container.querySelectorAll('[data-harpa-content]')).filter(
      (el) => el !== page
    )
    otherPages.forEach((el) => {
      expect(el.querySelectorAll('[data-page-selected="true"]').length).toBe(0)
    })
  })

  it('offers only copy and select-all once the page is fully selected', async () => {
    const { container } = renderHarpa()
    await settle()
    const menu = await openMenuOnStanza(container)
    await act(async () => {
      fireEvent.click(within(menu).getByText('Selecionar tudo'))
    })

    const menuAgain = await openMenuOnStanza(container, true)
    expect(menuAgain.textContent).toContain('Copiar')
    expect(menuAgain.textContent).toContain('Selecionar tudo')
    expect(menuAgain.textContent).not.toContain('Marcador')
  })

  it('does not start a page drag from a right-button press', async () => {
    const { container, onNavigateHymn } = renderHarpa()
    await settle()
    const stanza = findStanza(container)

    await act(async () => {
      fireEvent.mouseDown(stanza!, { button: 2, clientX: 200 })
      fireEvent.mouseMove(window, { clientX: -80 })
      fireEvent.mouseUp(window, {})
      await new Promise((resolve) => setTimeout(resolve, 600))
    })

    expect(onNavigateHymn).not.toHaveBeenCalledWith(3)
  })
})
