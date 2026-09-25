import { describe, it, expect } from 'vitest'
import { estimateCapacityFromWindow } from '../src/components/book/useBookPageCapacity'

describe('Book page capacity follows the real sheet', () => {
  it('halves the capacity on narrow windows with a single column', () => {
    const wide = estimateCapacityFromWindow(1024, 900, 5)
    const narrow = estimateCapacityFromWindow(500, 900, 5)
    expect(wide).toBeGreaterThan(0)
    expect(narrow).toBeGreaterThan(0)
    expect(narrow).toBeLessThan(wide)
  })
})
