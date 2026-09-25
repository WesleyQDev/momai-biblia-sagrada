// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { HarpaBook } from '../src/components/HarpaBook'

describe('HarpaBook keeps the selected hymn visible', () => {
  it('does not drift from hymn 500 to the first hymn of the spread', async () => {
    const onNavigate = vi.fn()
    render(
      <HarpaBook
        hymnNumber={500}
        favoriteNumbers={new Set()}
        onNavigateHymn={onNavigate}
        onToggleFavorite={() => {}}
        onCopyHymn={() => {}}
        onOpenDrawer={() => {}}
        onBackToHome={() => {}}
      />
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    const drifted = onNavigate.mock.calls.some(([n]) => n !== 500)
    expect(drifted).toBe(false)
  })
})
