import { describe, it, expect } from 'vitest'
import {
  computeFitScale,
  MIN_FIT_SCALE,
  MAX_FIT_SCALE
} from '../src/services/fit-scale'

describe('computeFitScale — text always fits the paper height', () => {
  it('keeps scale 1 when the hymn height matches the sheet exactly', () => {
    expect(computeFitScale(600, 600)).toBe(1)
  })

  it('shrinks proportionally when the hymn overflows the sheet', () => {
    expect(computeFitScale(800, 600)).toBeCloseTo(0.75)
    expect(computeFitScale(1200, 600)).toBeCloseTo(0.5)
  })

  it('grows when the sheet has spare height, up to the readability cap', () => {
    expect(computeFitScale(400, 600)).toBeCloseTo(1.5)
    expect(computeFitScale(300, 600)).toBe(MAX_FIT_SCALE)
    expect(computeFitScale(100, 600)).toBe(MAX_FIT_SCALE)
  })

  it('never returns 1 for missing measurements (jsdom / pre-layout)', () => {
    expect(computeFitScale(0, 0)).toBe(1)
    expect(computeFitScale(800, 0)).toBe(1)
    expect(computeFitScale(0, 600)).toBe(1)
  })

  it('does not shrink below the readability floor', () => {
    expect(computeFitScale(10000, 600)).toBe(MIN_FIT_SCALE)
  })

  it('tolerates non-finite measurements', () => {
    expect(computeFitScale(Number.NaN, 600)).toBe(1)
    expect(computeFitScale(800, Number.POSITIVE_INFINITY)).toBe(1)
  })
})
