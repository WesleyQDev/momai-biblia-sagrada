// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { HarpaBook } from '../src/components/HarpaBook'

describe('Harpa drag starts anywhere on the sheet, including over the hymn text', () => {
  it('turns the page when the drag starts on a stanza', async () => {
    const onNavigateHymn = vi.fn()
    const { container } = render(
      <HarpaBook
        hymnNumber={1}
        favoriteNumbers={new Set()}
        onNavigateHymn={onNavigateHymn}
        onToggleFavorite={() => {}}
        onCopyHymn={() => {}}
        onOpenDrawer={() => {}}
        onBackToHome={() => {}}
      />
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    const stanza = Array.from(container.querySelectorAll('div.break-inside-avoid')).find((el) =>
      el.textContent?.includes('Deus prometeu com certeza')
    )
    expect(stanza).toBeTruthy()

    await act(async () => {
      fireEvent.mouseDown(stanza!, { clientX: 200 })
      fireEvent.mouseMove(window, { clientX: -80 })
      fireEvent.mouseUp(window, {})
      await new Promise((resolve) => setTimeout(resolve, 600))
    })

    // Spread 1 shows hymns 3-4, so the reader reports hymn 3
    expect(onNavigateHymn).toHaveBeenCalledWith(3)
  })
})
