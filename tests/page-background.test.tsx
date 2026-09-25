// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { BiblePage } from '../src/page'

async function settle(ms = 120) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  })
}

describe('Bible page background', () => {
  it('keeps the photograph crisp behind a theme-colored scrim, on every tab', async () => {
    const { container } = render(<BiblePage isActive locale="pt-BR" />)
    await settle()

    // Solid theme color stays as the readability base
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('bg-bg')

    // The photograph stays sharp: dimming comes from a scrim on top, never
    // from blurring the image (that read as a foggy, washed-out screen).
    const backdrop = container.querySelector('[data-page-backdrop]') as HTMLElement
    expect(backdrop).toBeTruthy()
    expect(backdrop.getAttribute('aria-hidden')).toBe('true')
    expect(backdrop.style.backgroundImage).toContain('url(')
    expect(backdrop.style.backgroundImage).not.toBe('none')
    expect(backdrop.style.backgroundSize).toBe('cover')
    expect(backdrop.style.filter).not.toContain('blur')
    expect(Number(backdrop.style.opacity || '1')).toBe(1)

    // Scrim built from the theme token, so light and dark themes both work
    const scrim = container.querySelector('[data-page-scrim]') as HTMLElement
    expect(scrim).toBeTruthy()
    expect(scrim.getAttribute('aria-hidden')).toBe('true')
    expect(scrim.style.backgroundColor).toContain('var(--bg-main)')

    const pageLayer = container.querySelector('[data-page-layer]') as HTMLElement
    expect(pageLayer).toBeTruthy()
    expect(pageLayer.className).toContain('relative')

    // Home → reading (Novo Testamento) keeps the very same backdrop
    const newTestament = Array.from(container.querySelectorAll('button')).find((b) =>
      (b.textContent || '').includes('Novo testamento')
    )
    expect(newTestament).toBeTruthy()
    await act(async () => {
      fireEvent.click(newTestament!)
    })
    await settle()

    expect(container.querySelector('[data-page-backdrop]')).toBeTruthy()
    expect(container.querySelector('[data-page-scrim]')).toBeTruthy()
    expect((container.firstElementChild as HTMLElement).className).toContain('bg-bg')
  })
})
