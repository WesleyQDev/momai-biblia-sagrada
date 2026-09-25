// Font scale bounds relative to the base sheet font: shrink enough to fit
// long hymns, grow into spare height, but stay readable in both directions.
export const MIN_FIT_SCALE = 0.5
export const MAX_FIT_SCALE = 1.8

/**
 * Scale factor that makes content of `naturalHeight` fit into
 * `availableHeight` without scrolling. Grows up to MAX_FIT_SCALE when the
 * sheet has spare height, shrinks down to MIN_FIT_SCALE on overflow, and
 * returns 1 when measurements are unavailable (pre-layout / jsdom).
 */
export function computeFitScale(naturalHeight: number, availableHeight: number): number {
  if (!Number.isFinite(naturalHeight) || !Number.isFinite(availableHeight)) return 1
  if (naturalHeight <= 0 || availableHeight <= 0) return 1
  const ratio = availableHeight / naturalHeight
  if (ratio >= 1) return Math.min(ratio, MAX_FIT_SCALE)
  return Math.max(ratio, MIN_FIT_SCALE)
}
