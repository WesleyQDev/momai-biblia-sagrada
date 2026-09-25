import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { harpaData } from '../services/harpa-data'
import { paginateHymns, type HarpaPage } from '../services/harpa-pagination'
import { computeFitScale, MAX_FIT_SCALE, MIN_FIT_SCALE } from '../services/fit-scale'
import { copyPageText } from '../services/page-text'
import { bibleStorage } from '../services/storage'
import { useBibleI18n } from '../services/i18n'
import { useHarpaLanguage } from '../services/useHarpaLanguage'
import ContextMenu from './ContextMenu'
import { BookStage, BOOK_PAPER, type BookPageRenderArgs } from './book/BookStage'
import { useBookPageCapacity } from './book/useBookPageCapacity'
import { LanguageMenu } from './LanguageMenu'
import type { HarpaHymn } from '../types/harpa'

interface HarpaBookProps {
  hymnNumber: number
  favoriteNumbers: Set<number>
  onNavigateHymn: (hymnNumber: number) => void
  onToggleFavorite: (hymn: HarpaHymn) => void
  onCopyHymn: (hymn: HarpaHymn) => void
  onOpenDrawer: () => void
  onBackToHome: () => void
}

export const HarpaBook: React.FC<HarpaBookProps> = ({
  hymnNumber,
  favoriteNumbers,
  onNavigateHymn,
  onToggleFavorite,
  onCopyHymn,
  onOpenDrawer,
  onBackToHome
}) => {
  const { t } = useBibleI18n()
  const { datasetVersion } = useHarpaLanguage()
  const [zoomScale, setZoomScale] = useState(0.95)
  const handleZoomChange = useCallback((updater: (prev: number) => number) => {
    setZoomScale((prev) => updater(prev))
  }, [])
  const charsPerPage = useBookPageCapacity()

  const pages = useMemo(() => {
    const raw = paginateHymns(harpaData.getAllHymns(), charsPerPage)
    if (raw.length === 0) return raw
    // Pad with a blank sheet so the doubled spread always closes perfectly
    if (raw.length % 2 !== 0) {
      const last = raw[raw.length - 1]
      raw.push({
        pageNumber: raw.length + 1,
        blocks: [],
        startHymn: last.endHymn,
        endHymn: last.endHymn
      })
    }
    return raw
  }, [charsPerPage, datasetVersion])

  const totalSpreads = Math.ceil(pages.length / 2)
  const [currentSpread, setCurrentSpread] = useState(0)
  const [contextHymn, setContextHymn] = useState<HarpaHymn | null>(null)
  const [contextPageElement, setContextPageElement] = useState<HTMLElement | null>(null)
  const [contextPageId, setContextPageId] = useState<number | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [selectionPageId, setSelectionPageId] = useState<number | null>(null)

  const currentPosRef = useRef({ hymnNumber })
  const lastPropsTargetRef = useRef('')
  const pendingSpreadRef = useRef<number | null>(null)

  const findPageOfHymn = (number: number) =>
    pages.findIndex((page) => page.blocks.some((block) => block.hymnNumber === number))

  // 1. Navigation triggered from the home screen or the index drawer
  useEffect(() => {
    const key = String(hymnNumber)
    if (lastPropsTargetRef.current === key) return
    lastPropsTargetRef.current = key
    currentPosRef.current = { hymnNumber }

    const targetIdx = findPageOfHymn(hymnNumber)
    if (targetIdx >= 0) {
      const targetSpread = Math.floor(targetIdx / 2)
      pendingSpreadRef.current = targetSpread
      setCurrentSpread(targetSpread)
    }
    setContextHymn(null)
    setContextPageElement(null)
    setContextPageId(null)
    setContextMenuPos(null)
    setSelectionPageId(null)
  }, [hymnNumber, pages])

  // 2. Reposition on the same hymn after a window resize repaginates the book
  useEffect(() => {
    const target = currentPosRef.current.hymnNumber || hymnNumber
    const targetIdx = findPageOfHymn(target)
    if (targetIdx >= 0) {
      const targetSpread = Math.floor(targetIdx / 2)
      pendingSpreadRef.current = targetSpread
      setCurrentSpread(targetSpread)
    } else {
      setCurrentSpread((prev) => Math.min(Math.max(0, prev), Math.max(0, totalSpreads - 1)))
    }
  }, [pages, totalSpreads, hymnNumber])

  // 3. Keep the parent informed about the hymn currently open.
  // When the requested hymn is already visible on this spread, keep it
  // instead of drifting to the first hymn of the left page.
  // While a programmatic navigation is still flying to its target spread,
  // wait instead of reporting the intermediate pages.
  useEffect(() => {
    const pending = pendingSpreadRef.current
    if (pending !== null) {
      if (currentSpread !== pending) return
      pendingSpreadRef.current = null
    }

    const leftPage = pages[currentSpread * 2]
    const rightPage = pages[currentSpread * 2 + 1]
    const visible = new Set<number>()
    leftPage?.blocks.forEach((block) => visible.add(block.hymnNumber))
    rightPage?.blocks.forEach((block) => visible.add(block.hymnNumber))

    if (visible.has(hymnNumber)) {
      currentPosRef.current = { hymnNumber }
      lastPropsTargetRef.current = String(hymnNumber)
      return
    }

    const activeHymn =
      leftPage?.blocks[0]?.hymnNumber ?? rightPage?.blocks[0]?.hymnNumber ?? undefined
    if (!activeHymn) return

    currentPosRef.current = { hymnNumber: activeHymn }
    const key = String(activeHymn)
    if (lastPropsTargetRef.current !== key) {
      lastPropsTargetRef.current = key
      onNavigateHymn(activeHymn)
    }
  }, [currentSpread, pages, onNavigateHymn, hymnNumber])

  const closeContextMenu = () => {
    setContextMenuPos(null)
    setContextHymn(null)
    setContextPageElement(null)
    setContextPageId(null)
  }

  const handleHymnContextMenu = (number: number, interactive: boolean, event: React.MouseEvent) => {
    if (!interactive) return
    const hymn = harpaData.getHymn(number)
    if (!hymn) return
    event.preventDefault()
    event.stopPropagation()
    setContextHymn(hymn)
    setContextMenuPos({ x: event.clientX, y: event.clientY })
    const pageElement = (event.target as HTMLElement).closest(
      '[data-harpa-content]'
    ) as HTMLElement | null
    setContextPageElement(pageElement)
    const pageId = Number(pageElement?.dataset.pageId)
    setContextPageId(Number.isInteger(pageId) && pageId > 0 ? pageId : null)
  }

  // "Select all" paints the whole page with the same custom highlight used on
  // right-click — the native Electron/blue text selection is never involved.
  const handleSelectPage = () => {
    if (contextPageId != null) setSelectionPageId(contextPageId)
  }

  const renderPage = ({ index, pageNumber, interactive }: BookPageRenderArgs) => {
    const page = pages[index]
    if (!page || page.blocks.length === 0) return null

    return (
      <RenderHarpaPage
        page={page}
        pageNum={pageNumber}
        favoriteNumbers={favoriteNumbers}
        selectionPageId={selectionPageId}
        zoomScale={zoomScale}
        onHymnContextMenu={(number, event) => handleHymnContextMenu(number, interactive, event)}
      />
    )
  }

  const pageFullySelected = contextPageId != null && contextPageId === selectionPageId

  if (!harpaData.getHymn(hymnNumber)) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-text-muted">{t('harpa.not_found')}</p>
        <button
          onClick={onBackToHome}
          className="px-4 py-1.5 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all active:scale-95 cursor-pointer"
        >
          {t('header.home')}
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <BookStage
        totalSpreads={totalSpreads}
        spread={currentSpread}
        onSpreadChange={setCurrentSpread}
        renderPage={renderPage}
        zoomScale={zoomScale}
        onZoomChange={handleZoomChange}
        homeLabel={t('header.home')}
        indexLabel={t('header.index')}
        toolbar={
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl bg-input/40 border border-border text-[11px] font-medium text-text-muted">
              {t('harpa.subtitle')}
            </span>
            <LanguageMenu />
          </div>
        }
        flipHints={{
          next: t('harpa.click_flip_next'),
          nextOverflow: t('harpa.click_flip_end'),
          nextEnd: t('harpa.click_flip_end'),
          prev: t('harpa.click_flip_prev'),
          prevOverflow: t('harpa.click_flip_start'),
          prevStart: t('harpa.click_flip_start')
        }}
        onBackToHome={onBackToHome}
        onOpenIndex={onOpenDrawer}
      />

      {contextMenuPos && contextHymn && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={closeContextMenu}
          items={
            pageFullySelected
              ? [
                  {
                    id: 'copy',
                    label: t('harpa.copy'),
                    onClick: () => copyPageText(contextPageElement)
                  },
                  {
                    id: 'select-all',
                    label: t('harpa.select_all'),
                    onClick: handleSelectPage
                  }
                ]
              : [
                  {
                    id: 'copy',
                    label: t('harpa.copy'),
                    onClick: () => onCopyHymn(contextHymn)
                  },
                  {
                    id: 'bookmark',
                    label: favoriteNumbers.has(contextHymn.number)
                      ? t('harpa.unbookmark')
                      : t('harpa.bookmark'),
                    emoji: '⭐',
                    onClick: () => onToggleFavorite(contextHymn)
                  },
                  {
                    id: 'select-all',
                    label: t('harpa.select_all'),
                    onClick: handleSelectPage
                  }
                ]
          }
        />
      )}
    </div>
  )
}

const RenderHarpaPage: React.FC<{
  page: HarpaPage
  pageNum: number
  favoriteNumbers: Set<number>
  selectionPageId: number | null
  zoomScale: number
  onHymnContextMenu: (hymnNumber: number, event: React.MouseEvent) => void
}> = ({ page, pageNum, favoriteNumbers, selectionPageId, zoomScale, onHymnContextMenu }) => {
  const { t } = useBibleI18n()
  const boxRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fit the hymn to the paper height: shrink long hymns so nothing clips,
  // grow into spare height (maximized windows) up to a readability cap.
  useLayoutEffect(() => {
    const box = boxRef.current
    const content = contentRef.current
    if (!box || !content) return

    const update = () => {
      content.style.fontSize = ''
      const base = (parseFloat(window.getComputedStyle(content).fontSize) || 13) * zoomScale
      const minPx = base * MIN_FIT_SCALE
      const maxPx = base * MAX_FIT_SCALE
      let size = base
      content.style.fontSize = `${size}px`

      for (let i = 0; i < 5; i++) {
        const scale = computeFitScale(content.scrollHeight, box.clientHeight)
        const next = Math.min(Math.max(size * scale, minPx), maxPx)
        const settled = Math.abs(next - size) < 0.5
        size = next
        content.style.fontSize = `${size}px`
        if (settled) break
      }
    }

    update()

    // Only the box is observed: font changes resize the content, which would
    // retrigger a resize loop if observed too.
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update)
      observer.observe(box)
    }
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
      content.style.fontSize = ''
    }
  }, [page, zoomScale])

  const headerHymns =
    page.startHymn === page.endHymn ? String(page.startHymn) : `${page.startHymn}-${page.endHymn}`

  // "Select all" paints every block of this page with the same custom
  // highlight used on right-click; the native text selection is never used.
  const isPageSelected = selectionPageId === pageNum
  const pageSelectedAttr = isPageSelected ? 'true' : undefined

  return (
    <div
      className="flex-1 flex flex-col justify-start h-full overflow-hidden font-serif select-none"
      style={{ color: BOOK_PAPER.ink }}
    >
      {/* Running header */}
      <div
        className="flex items-center justify-between pb-1 mb-2 border-b text-[11px] font-bold uppercase tracking-wider select-none"
        style={{ color: BOOK_PAPER.ink, borderColor: BOOK_PAPER.rule }}
      >
        <span>{pageNum % 2 !== 0 ? pageNum : ''}</span>
        <span className="tracking-widest">
          {t('harpa.title')} {headerHymns}
        </span>
        <span>{pageNum % 2 === 0 ? pageNum : ''}</span>
      </div>

      <div
        ref={boxRef}
        data-scroll-container=""
        style={{
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          color: BOOK_PAPER.ink
        }}
        className="flex-1 min-h-0 overflow-hidden [&::-webkit-scrollbar]:hidden flex flex-col justify-start select-none"
      >
        <div
          ref={contentRef}
          data-harpa-content=""
          data-page-id={pageNum}
          className="columns-1 sm:columns-2 gap-5 text-[12px] sm:text-[13px] leading-[1.62] text-justify select-none"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            hyphens: 'auto',
            color: BOOK_PAPER.ink
          }}
        >
          {page.blocks.map((block, idx) => {
            if (block.type === 'hymn_head') {
              return (
                <div
                  key={`head-${block.hymnNumber}-${idx}`}
                  onContextMenu={(e) => onHymnContextMenu(block.hymnNumber, e)}
                  data-page-selected={pageSelectedAttr}
                  className={`break-inside-avoid mb-2 mt-3 first:mt-0 text-center rounded transition-colors ${
                    isPageSelected ? 'bg-accent/10' : 'hover:bg-[#ede5cc]'
                  }`}
                  style={{ color: BOOK_PAPER.ink }}
                >
                  <div className="text-[9px] font-sans font-bold tracking-[0.28em] uppercase">
                    {t('harpa.hymn_label')}
                  </div>
                  <div className="text-3xl font-serif font-black leading-none mt-0.5">
                    {block.hymnNumber}
                  </div>
                  <div className="text-sm font-serif font-bold mt-1 flex items-center justify-center gap-1.5">
                    {favoriteNumbers.has(block.hymnNumber) && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                    )}
                    <span>{block.title}</span>
                  </div>
                  <div className="w-10 h-[1px] mx-auto mt-1.5" style={{ background: BOOK_PAPER.rule }} />
                </div>
              )
            }

            if (block.type === 'stanza') {
              return (
                <div
                  key={`stanza-${block.hymnNumber}-${block.index}-${idx}`}
                  onContextMenu={(e) => onHymnContextMenu(block.hymnNumber, e)}
                  data-page-selected={pageSelectedAttr}
                  className={`break-inside-avoid mb-2 pl-5 rounded transition-colors ${
                    isPageSelected ? 'bg-accent/10' : 'hover:bg-[#ede5cc]'
                  }`}
                  style={{ color: BOOK_PAPER.ink }}
                >
                  <span
                    aria-label={`${t('harpa.stanza')} ${block.index + 1}`}
                    className="font-sans font-bold text-[10px] mr-1.5 align-top"
                  >
                    {block.index + 1}
                  </span>{' '}
                  <span style={{ whiteSpace: 'pre-line' }}>{block.lines.join('\n')}</span>
                </div>
              )
            }

            return (
              <div
                key={`chorus-${block.hymnNumber}-${idx}`}
                onContextMenu={(e) => onHymnContextMenu(block.hymnNumber, e)}
                data-page-selected={pageSelectedAttr}
                className={`break-inside-avoid mb-2 pl-8 italic rounded transition-colors ${
                  isPageSelected ? 'bg-accent/10' : 'hover:bg-[#ede5cc]'
                }`}
                style={{ color: BOOK_PAPER.ink }}
              >
                <span className="font-sans font-bold text-[10px] not-italic mr-1.5 align-top uppercase">
                  {t('harpa.chorus')}
                </span>{' '}
                <span style={{ whiteSpace: 'pre-line' }}>{block.lines.join('\n')}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
