// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { HarpaBook } from '../src/components/HarpaBook'
import { harpaData } from '../src/services/harpa-data'

describe('Harpa pages fit without scrolling', () => {
  it('renders the longest hymn fully with no scrollable container', async () => {
    const longest = harpaData.getHymn(380)!
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
    const text = container.textContent || ''
    longest.stanzas.flat().forEach((line) => {
      expect(text.includes(line.slice(0, 20))).toBe(true)
    })
    const scrollers = container.querySelectorAll('.overflow-y-auto')
    expect(scrollers.length).toBe(0)
  })
})
