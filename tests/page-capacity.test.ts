import { describe, it, expect } from 'vitest'
import {
  computeBookPageCapacity,
  estimateCapacityFromWindow,
  TWO_COLUMNS_MIN_VIEWPORT_PX
} from '../src/components/book/useBookPageCapacity'

describe('computeBookPageCapacity — capacity matches the real rendered sheet', () => {
  it('uses half of the paper per page when computing the column width', () => {
    // paper 800 wide → each page 400 → content 344 at 2 columns → 162px columns
    const wide = computeBookPageCapacity(
      { width: 800, height: 600 },
      TWO_COLUMNS_MIN_VIEWPORT_PX + 100,
      5
    )
    // narrow paper must fit strictly less text
    const narrow = computeBookPageCapacity(
      { width: 400, height: 600 },
      TWO_COLUMNS_MIN_VIEWPORT_PX + 100,
      5
    )
    expect(narrow).toBeLessThan(wide)
  })

  it('adjusts padding and font on narrow viewports', () => {
    const single = computeBookPageCapacity(
      { width: 800, height: 600 },
      TWO_COLUMNS_MIN_VIEWPORT_PX - 1,
      5
    )
    // Narrow viewport still fills the page with appropriate capacity
    expect(single).toBeGreaterThan(1500)
  })

  it('never returns a degenerate capacity', () => {
    const capacity = computeBookPageCapacity({ width: 10, height: 10 }, 900, 5)
    expect(capacity).toBeGreaterThan(50)
    expect(Number.isFinite(capacity)).toBe(true)
  })

  it('leaves a safety margin so the last line is never clipped', () => {
    // 1000x600 paper, wide viewport, 5px glyphs:
    // With 0.95 default zoom: effective line height ~19.14px -> 28 lines,
    // effective char width 4.75px -> 92 chars/line.
    const capacity = computeBookPageCapacity({ width: 1000, height: 600 }, 900, 5)
    expect(capacity).toBeLessThan(92 * 28)
    expect(capacity).toBeGreaterThan(92 * 28 * 0.9)
  })

  it('falls back to a window estimate before the sheet is measured', () => {
    const estimate = estimateCapacityFromWindow(900, 660, 5)
    expect(estimate).toBeGreaterThan(1000)
    expect(estimate).toBeLessThan(3500)
    // windowed must hold less than fullscreen
    expect(estimateCapacityFromWindow(900, 660, 5)).toBeLessThan(
      estimateCapacityFromWindow(1400, 1000, 5)
    )
  })
})
