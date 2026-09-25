// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { BiblePage } from '../src/page'
import { bibleStorage } from '../src/services/storage'

describe('Harpa opens at hymn 1 from home', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {}
    bibleStorage.setLastHymn(465)
  })

  it('shows hymn 1 instead of the stored hymn 465', async () => {
    const { container } = render(<BiblePage isActive locale="pt-BR" />)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    const harpaBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      (b.textContent || '').includes('Harpa')
    )
    expect(harpaBtn).toBeTruthy()
    await act(async () => {
      fireEvent.click(harpaBtn!)
      await new Promise((resolve) => setTimeout(resolve, 300))
    })
    const text = container.textContent || ''
    expect(text.includes('Chuvas de Gra')).toBe(true)
    expect(text.includes('Ele Sofreu Por mim')).toBe(false)
  })
})
