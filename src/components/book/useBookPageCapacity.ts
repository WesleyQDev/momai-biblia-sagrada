import { useEffect, useMemo, useState } from 'react'

export interface PaperBox {
  width: number
  height: number
}

// Geometry mirrors the rendered markup (BookStage sheet + the page body):
// each sheet carries two pages (left and right leaf), each holding a single
// text column that flows from the running header to the bottom spacing.
export const TWO_COLUMNS_MIN_VIEWPORT_PX = 640 // Tailwind `sm`
export const BOOK_WIDTH_MAX_PX = 1152 // stage max-w-6xl
export const BOOK_CASE_CHROME_PX = 32 // sheet case padding + border
export const PAGE_PADDING_X_PX = 40 // page px-5
export const PAGE_PADDING_X_WIDE_PX = 60 // page sm:px-7 + md:pr-8 / md:pl-8
export const PAGE_HEADER_HEIGHT_PX = 24 // running header + vertical padding
export const LINE_HEIGHT_RATIO = 1.55 // leading-[1.55]
export const BASE_FONT_WIDE_PX = 13
export const BASE_FONT_NARROW_PX = 12
export const CAPACITY_SAFETY = 0.96 // fills down to the bottom spacing without clipping
export const FALLBACK_CHAR_WIDTH_PX = 6.6 // real average for Georgia 13px proportional serif font
export const MIN_PAGE_CAPACITY = 120
export const BOOK_MAX_HEIGHT_PX = 860
export const TOP_BAR_AND_MARGINS_PX = 90
export const PAGE_VERTICAL_PADDING_PX = 56 // top padding + running header + bottom spacing

const SAMPLE_TEXT = 'aos e que não do por uma como para os seus sobre '

/**
 * Characters that fit one page (half of the physical sheet), computed from the
 * measured paper box so text fills down to the bottom margin with an elegant
 * spacing without clipping.
 */
export function computeBookPageCapacity(
  paper: PaperBox,
  windowWidth: number,
  charWidthPx: number,
  zoomScale = 0.95
): number {
  const isWide = windowWidth >= TWO_COLUMNS_MIN_VIEWPORT_PX
  const pageWidth = paper.width / 2
  const pagePaddingX = isWide ? PAGE_PADDING_X_WIDE_PX : PAGE_PADDING_X_PX
  const contentWidth = Math.max(100, pageWidth - pagePaddingX)
  const effectiveCharWidth = Math.max(1, charWidthPx * zoomScale)
  const charsPerLine = Math.floor(contentWidth / effectiveCharWidth)

  const baseFont = (isWide ? BASE_FONT_WIDE_PX : BASE_FONT_NARROW_PX) * zoomScale
  const lineHeight = baseFont * LINE_HEIGHT_RATIO
  const usableHeight = Math.max(80, paper.height - PAGE_VERTICAL_PADDING_PX)
  const linesPerPage = Math.floor(usableHeight / lineHeight)

  if (charsPerLine < 8 || linesPerPage < 4) return MIN_PAGE_CAPACITY
  return Math.max(
    MIN_PAGE_CAPACITY,
    Math.floor(linesPerPage * charsPerLine * CAPACITY_SAFETY)
  )
}

/** Capacity from the window alone, used until the sheet box is measured. */
export function estimateCapacityFromWindow(
  windowWidth: number,
  windowHeight: number,
  charWidthPx: number,
  zoomScale = 0.95
): number {
  const bookWidth = Math.min(BOOK_WIDTH_MAX_PX, Math.max(240, windowWidth - 32))
  const paper: PaperBox = {
    width: Math.max(200, bookWidth - BOOK_CASE_CHROME_PX),
    height: Math.max(
      160,
      Math.min(BOOK_MAX_HEIGHT_PX, windowHeight - TOP_BAR_AND_MARGINS_PX)
    )
  }
  return computeBookPageCapacity(paper, windowWidth, charWidthPx, zoomScale)
}

/**
 * Measures the average glyph width with the page font so the capacity follows
 * the real typography (font fallback included). Null when unmeasurable.
 */
function measureCharWidth(windowWidth: number): number | null {
  if (typeof document === 'undefined') return null
  const probe = document.createElement('span')
  probe.textContent = SAMPLE_TEXT.repeat(3)
  probe.style.cssText = [
    'position:absolute',
    'left:-9999px',
    'top:0',
    'visibility:hidden',
    'white-space:nowrap',
    'pointer-events:none',
    'font-family:Georgia,"Times New Roman",serif',
    `font-size:${windowWidth >= TWO_COLUMNS_MIN_VIEWPORT_PX ? BASE_FONT_WIDE_PX : BASE_FONT_NARROW_PX}px`
  ].join(';')
  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()
  return width > 0 ? width / probe.textContent!.length : null
}

/**
 * Character budget for a single book page. Uses the measured sheet box when
 * the stage has already been laid out and falls back to a window estimate
 * before that (first paint, jsdom).
 */
export function useBookPageCapacity(paper?: PaperBox | null, zoomScale = 0.95): number {
  const [size, setSize] = useState(() =>
    typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 1024, height: 800 }
  )

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const charWidthPx = useMemo(
    () => measureCharWidth(size.width) ?? FALLBACK_CHAR_WIDTH_PX,
    [size.width]
  )

  return useMemo(() => {
    if (paper && paper.width > 0 && paper.height > 0) {
      return computeBookPageCapacity(paper, size.width, charWidthPx, zoomScale)
    }
    return estimateCapacityFromWindow(size.width, size.height, charWidthPx, zoomScale)
  }, [paper, size, charWidthPx, zoomScale])
}
