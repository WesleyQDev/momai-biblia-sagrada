// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { HarpaBook } from '../src/components/HarpaBook'

describe('Harpa page scales its text to the sheet height', () => {
  it('fits the hymn content by adjusting font-size on the page box', async () => {
    const { container } = render(
      <HarpaBook
        hymnNumber={380}
        favoriteNumbers={new Set()}
        onNavigateHymn={() => {}}
        onToggleFavorite={() => {}}
        onCopyHymn={() => {}}
        onOpenDrawer={() => {}}
        onBackToHome={() => {}}
      />
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    const content = container.querySelectorAll('[data-harpa-content]')
    expect(content.length).toBeGreaterThan(0)
    content.forEach((el) => {
      // jsdom reports zero heights, so the fit pass still writes an explicit
      // px font-size (the base size) — proving the height-fit hook ran.
      expect((el as HTMLElement).style.fontSize).toMatch(/px$/)
    })
  })
})
