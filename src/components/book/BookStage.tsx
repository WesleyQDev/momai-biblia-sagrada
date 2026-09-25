import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export const BOOK_PAPER = {
  background: '#fbf8ee',
  rule: '#e5dfd2',
  ink: '#000000'
} as const

export interface BookPageRenderArgs {
  index: number
  pageNumber: number
  interactive: boolean
}

export interface BookFlipHints {
  next: string
  nextOverflow: string
  nextEnd: string
  prev: string
  prevOverflow: string
  prevStart: string
}

interface BookStageProps {
  totalSpreads: number
  spread: number
  onSpreadChange: (spread: number) => void
  renderPage: (args: BookPageRenderArgs) => React.ReactNode
  homeLabel: string
  indexLabel: string
  toolbar?: React.ReactNode
  flipHints: BookFlipHints
  onBackToHome: () => void
  onOpenIndex: () => void
  onOverflowForward?: () => void
  onOverflowBackward?: () => void
  /** Reports the measured paper box so readers can paginate against it. */
  onPaperLayout?: (box: { width: number; height: number }) => void
  zoomScale?: number
  onZoomChange?: (updater: (prev: number) => number) => void
}

/**
 * Physical open-book stage shared by the Bible and the Harpa Cristã reader:
 * leather case, paper sheets, 3D leaf turning, drag/keyboard/corner controls.
 * Content rendering stays with each reader through renderPage.
 */
export const BookStage: React.FC<BookStageProps> = ({
  totalSpreads,
  spread,
  onSpreadChange,
  renderPage,
  homeLabel,
  indexLabel,
  toolbar,
  flipHints,
  onBackToHome,
  onOpenIndex,
  onOverflowForward,
  onOverflowBackward,
  onPaperLayout,
  zoomScale,
  onZoomChange
}) => {
  const [turningState, setTurningState] = useState<{
    isTurning: boolean
    direction: 'forward' | 'backward'
    rotation: number
  }>({
    isTurning: false,
    direction: 'forward',
    rotation: 0
  })
  const [isCornerHovered, setIsCornerHovered] = useState<'left' | 'right' | null>(null)
  const [showZoomBadge, setShowZoomBadge] = useState(false)
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRenderRef = useRef(true)

  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    setShowZoomBadge(true)
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current)
    zoomTimerRef.current = setTimeout(() => {
      setShowZoomBadge(false)
    }, 1200)
    return () => {
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current)
    }
  }, [zoomScale])

  useEffect(() => {
    const bookEl = caseRef.current
    if (!bookEl) return

    const handleWheel = (e: WheelEvent) => {
      if (!onZoomChangeRef.current) return
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY
      if (delta < 0) {
        // Scroll up -> Zoom in
        onZoomChangeRef.current((prev) => Math.min(1.8, +(prev + 0.05).toFixed(2)))
      } else if (delta > 0) {
        // Scroll down -> Zoom out
        onZoomChangeRef.current((prev) => Math.max(0.75, +(prev - 0.05).toFixed(2)))
      }
    }

    bookEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      bookEl.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const currentRotationRef = useRef(0)
  const turningDirectionRef = useRef<'forward' | 'backward'>('forward')
  const startXRef = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const caseRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)

  // Paper height follows the real stage box (never the viewport): in windowed
  // mode 100vh overshoots the flex container and clips the bottom leather edge.
  const [paperHeight, setPaperHeight] = useState(860)
  const onPaperLayoutRef = useRef(onPaperLayout)
  onPaperLayoutRef.current = onPaperLayout

  useLayoutEffect(() => {
    const stage = stageRef.current
    const bookCase = caseRef.current
    if (!stage || !bookCase) return

    const update = () => {
      const caseStyle = getComputedStyle(bookCase)
      const chrome =
        parseFloat(caseStyle.paddingTop) +
        parseFloat(caseStyle.paddingBottom) +
        parseFloat(caseStyle.borderTopWidth) +
        parseFloat(caseStyle.borderBottomWidth)
      const available = stage.clientHeight - chrome
      const nextHeight = available > 0 ? Math.min(860, Math.floor(available)) : paperHeight
      if (available > 0) {
        setPaperHeight(nextHeight)
      }

      // Report the real sheet so the reader paginates against it: the sheet
      // width is what decides how many characters fit per line in windowed mode.
      const paperElement = bookRef.current
      if (paperElement && onPaperLayoutRef.current) {
        onPaperLayoutRef.current({ width: paperElement.clientWidth, height: nextHeight })
      }
    }

    update()

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update)
      observer.observe(stage)
    }
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  // flipNext/flipPrev run inside 360ms animations; refs keep the latest spread
  // and callbacks reachable without restarting the timers.
  const spreadRef = useRef(spread)
  spreadRef.current = spread
  const totalSpreadsRef = useRef(totalSpreads)
  totalSpreadsRef.current = totalSpreads
  const overflowForwardRef = useRef(onOverflowForward)
  overflowForwardRef.current = onOverflowForward
  const overflowBackwardRef = useRef(onOverflowBackward)
  overflowBackwardRef.current = onOverflowBackward
  // Blocks keyboard/click turns while a drag holds the leaf mid-air
  const isTurningRef = useRef(false)
  isTurningRef.current = turningState.isTurning

  const flipNext = useCallback(() => {
    if (isTurningRef.current || isAnimatingRef.current) return
    if (spreadRef.current >= totalSpreadsRef.current - 1) return

    isAnimatingRef.current = true
    setTurningState({ isTurning: true, direction: 'forward', rotation: 0 })

    requestAnimationFrame(() => {
      setTurningState({ isTurning: true, direction: 'forward', rotation: -180 })
    })

    setTimeout(() => {
      onSpreadChange(Math.min(totalSpreadsRef.current - 1, spreadRef.current + 1))
      setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
      isAnimatingRef.current = false
    }, 360)
  }, [onSpreadChange])

  const flipPrev = useCallback(() => {
    if (isTurningRef.current || isAnimatingRef.current) return
    if (spreadRef.current <= 0) return

    isAnimatingRef.current = true
    setTurningState({ isTurning: true, direction: 'backward', rotation: -180 })

    requestAnimationFrame(() => {
      setTurningState({ isTurning: true, direction: 'backward', rotation: 0 })
    })

    setTimeout(() => {
      onSpreadChange(Math.max(0, spreadRef.current - 1))
      setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
      isAnimatingRef.current = false
    }, 360)
  }, [onSpreadChange])

  const getClientPos = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const me = e as MouseEvent
    return { x: me.clientX, y: me.clientY }
  }

  // Window-level listeners of the active drag, kept in a ref so a gesture
  // that never received its end event (released outside the window, blur)
  // can always be detached before the next one starts.
  const dragListenersRef = useRef<{
    move: (e: MouseEvent | TouchEvent) => void
    end: () => void
  } | null>(null)

  const detachDragListeners = () => {
    const listeners = dragListenersRef.current
    if (!listeners) return
    window.removeEventListener('mousemove', listeners.move)
    window.removeEventListener('touchmove', listeners.move)
    window.removeEventListener('mouseup', listeners.end)
    window.removeEventListener('touchend', listeners.end)
    window.removeEventListener('blur', listeners.end)
    document.removeEventListener('mouseleave', listeners.end)
    dragListenersRef.current = null
  }

  // Safety net: never leave window listeners behind on unmount
  useEffect(() => detachDragListeners, [])

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const nativeEvent = e.nativeEvent
    // Only the primary button drags pages; right-click opens context menus
    if (!('touches' in nativeEvent) && (nativeEvent as MouseEvent).button !== 0) return

    // A previous gesture lost its end event: clear the stuck state so the new
    // drag is not swallowed by a leaf left hanging mid-air.
    const staleGesture = isDraggingRef.current && !dragListenersRef.current
    if (staleGesture) {
      isDraggingRef.current = false
      isAnimatingRef.current = false
      setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
    } else if (turningState.isTurning || isAnimatingRef.current) {
      return
    }

    const startPos = getClientPos(nativeEvent)
    if (!bookRef.current) return

    const rect = bookRef.current.getBoundingClientRect()
    const midPoint = rect.left + rect.width / 2

    let direction: 'forward' | 'backward' = 'forward'
    if (startPos.x > midPoint && spreadRef.current < totalSpreadsRef.current - 1) {
      direction = 'forward'
    } else if (startPos.x <= midPoint && spreadRef.current > 0) {
      direction = 'backward'
    } else {
      direction = 'forward'
    }

    const target = nativeEvent.target as HTMLElement | null
    let scrollContainer = target?.closest?.('[data-scroll-container]') as HTMLElement | null
    if (!scrollContainer && bookRef.current) {
      const bookRect = bookRef.current.getBoundingClientRect()
      const isLeft = startPos.x < bookRect.left + bookRect.width / 2
      const containers = bookRef.current.querySelectorAll<HTMLElement>('[data-scroll-container]')
      if (containers.length > 0) {
        scrollContainer = isLeft ? containers[0] : (containers[1] || containers[0])
      }
    }
    const startScrollTop = scrollContainer ? scrollContainer.scrollTop : 0
    let gestureType: 'undecided' | 'page_turn' | 'vertical_scroll' = 'undecided'

    isDraggingRef.current = true
    hasDraggedRef.current = false
    turningDirectionRef.current = direction
    startXRef.current = startPos.x
    currentRotationRef.current = direction === 'forward' ? 0 : -180

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return
      const curPos = getClientPos(moveEvent)
      const deltaX = curPos.x - startPos.x
      const deltaY = curPos.y - startPos.y

      if (gestureType === 'undecided') {
        if (Math.abs(deltaY) > 5 && Math.abs(deltaY) > Math.abs(deltaX)) {
          gestureType = 'vertical_scroll'
          hasDraggedRef.current = true
        } else if (Math.abs(deltaX) > 8 && Math.abs(deltaX) >= Math.abs(deltaY)) {
          if (
            (startPos.x > midPoint && spreadRef.current < totalSpreadsRef.current - 1) ||
            (startPos.x <= midPoint && spreadRef.current > 0)
          ) {
            gestureType = 'page_turn'
            hasDraggedRef.current = true
          }
        }
      }

      if (gestureType === 'vertical_scroll') {
        if (scrollContainer) {
          scrollContainer.scrollTop = startScrollTop - deltaY
        }
        return
      }

      if (gestureType === 'page_turn') {
        const progress = Math.max(-1, Math.min(1, deltaX / 280))
        const rot =
          direction === 'forward'
            ? Math.max(-180, Math.min(0, progress * 180))
            : Math.max(-180, Math.min(0, -180 + progress * 180))

        currentRotationRef.current = rot
        setTurningState({ isTurning: true, direction, rotation: rot })
      }
    }

    const handleEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false

      detachDragListeners()

      if (!hasDraggedRef.current || gestureType === 'vertical_scroll') return

      isAnimatingRef.current = true
      const dir = turningDirectionRef.current
      const finalRot = currentRotationRef.current

      if (dir === 'forward') {
        if (finalRot < -45) {
          setTurningState({ isTurning: true, direction: 'forward', rotation: -180 })
          setTimeout(() => {
            if (spreadRef.current < totalSpreadsRef.current - 1) {
              onSpreadChange(Math.min(totalSpreadsRef.current - 1, spreadRef.current + 1))
            } else {
              overflowForwardRef.current?.()
            }
            setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
            isAnimatingRef.current = false
          }, 460)
        } else {
          setTurningState({ isTurning: true, direction: 'forward', rotation: 0 })
          setTimeout(() => {
            setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
            isAnimatingRef.current = false
          }, 460)
        }
      } else if (finalRot > -135) {
        setTurningState({ isTurning: true, direction: 'backward', rotation: 0 })
        setTimeout(() => {
          if (spreadRef.current > 0) {
            onSpreadChange(Math.max(0, spreadRef.current - 1))
          } else {
            overflowBackwardRef.current?.()
          }
          setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
          isAnimatingRef.current = false
        }, 460)
      } else {
        setTurningState({ isTurning: true, direction: 'backward', rotation: -180 })
        setTimeout(() => {
          setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
          isAnimatingRef.current = false
        }, 460)
      }
    }

    dragListenersRef.current = { move: handleMove, end: handleEnd }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: true })
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchend', handleEnd)
    window.addEventListener('blur', handleEnd)
    document.addEventListener('mouseleave', handleEnd)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === 'ArrowRight') flipNext()
      else if (e.key === 'ArrowLeft') flipPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipNext, flipPrev])

  const totalPages = totalSpreads * 2
  const isTurning = turningState.isTurning
  const isForward = turningState.direction === 'forward'

  const pageAt = (index: number, interactive: boolean): React.ReactNode => {
    if (index < 0 || index >= totalPages) return null
    return renderPage({ index, pageNumber: index + 1, interactive })
  }

  // Peeking mechanism: while turning forward the right underlay already shows
  // the incoming right page, and vice versa.
  const leftUnderlayIndex = isTurning && !isForward ? (spread - 1) * 2 : spread * 2
  const rightUnderlayIndex = isTurning && isForward ? (spread + 1) * 2 + 1 : spread * 2 + 1
  const rightLeafIndex = isForward ? spread * 2 + 1 : (spread - 1) * 2 + 1
  const leftLeafIndex = isForward ? (spread + 1) * 2 : spread * 2

  const nextHint =
    spread < totalSpreads - 1
      ? flipHints.next
      : onOverflowForward
        ? flipHints.nextOverflow
        : flipHints.nextEnd

  const prevHint =
    spread > 0 ? flipHints.prev : onOverflowBackward ? flipHints.prevOverflow : flipHints.prevStart

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-between py-2 px-2 sm:px-4 select-none relative">
      {/* Top bar: home, reader controls and index */}
      <div className="w-full max-w-6xl mx-auto px-2 h-9 shrink-0 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>{homeLabel}</span>
        </button>

        <div className="flex items-center gap-2">
          {showZoomBadge && zoomScale && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-input/80 border border-border text-[11px] font-bold text-text shadow-sm animate-fade-in">
              <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              <span>{Math.round(zoomScale * 100)}%</span>
            </div>
          )}

          {toolbar}

          <button
            onClick={onOpenIndex}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>{indexLabel}</span>
          </button>
        </div>
      </div>

      {/* 3D book stage, vertically centered */}
      <div
        ref={stageRef}
        style={{
          perspective: '2200px',
          perspectiveOrigin: '50% 50%'
        }}
        className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex items-center justify-center my-auto"
      >
        <div
          ref={caseRef}
          className="relative rounded-[20px] sm:rounded-[26px] py-1.5 sm:py-2 px-2 sm:px-3 shadow-2xl border-4 border-[#1f2937]/90 w-full max-h-full"
          style={{
            background: 'linear-gradient(145deg, #111827 0%, #1f2937 40%, #030712 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), inset 0 2px 4px rgba(255,255,255,0.1)'
          }}
        >
          {/* Simulated zipper stitching */}
          <div className="absolute inset-1 sm:inset-1.5 rounded-[16px] sm:rounded-[22px] pointer-events-none border border-dashed border-[#4b5563]/60 opacity-60" />

          <div
            ref={bookRef}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            style={{
              transformStyle: 'preserve-3d',
              height: paperHeight,
              background: BOOK_PAPER.background,
              boxShadow: `
                -4px 0 0 0 #f3eee1,
                -5px 0 1px 0 rgba(0,0,0,0.15),
                -8px 0 0 0 #eae3d2,
                -9px 0 1px 0 rgba(0,0,0,0.15),
                -12px 0 0 0 #dfd6c1,
                -13px 0 2px 0 rgba(0,0,0,0.25),
                4px 0 0 0 #f3eee1,
                5px 0 1px 0 rgba(0,0,0,0.15),
                8px 0 0 0 #eae3d2,
                9px 0 1px 0 rgba(0,0,0,0.15),
                12px 0 0 0 #dfd6c1,
                13px 0 2px 0 rgba(0,0,0,0.25)
              `
            }}
            className="relative flex rounded-[12px] sm:rounded-[16px] overflow-hidden cursor-grab active:cursor-grabbing border border-[#e5e0d0]"
          >
            {/* Soft center spine */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#e2dcce] z-30 pointer-events-none" />

            {/* Left page underlay */}
            <div
              style={{
                width: '50%',
                boxShadow: 'inset -8px 0 12px -6px rgba(0,0,0,0.05)'
              }}
              className="h-full pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pr-8 flex flex-col justify-between bg-[#fbf8ee] overflow-hidden"
            >
              {pageAt(leftUnderlayIndex, true)}
            </div>

            {/* Right page underlay */}
            <div
              style={{
                width: '50%',
                boxShadow: 'inset 8px 0 12px -6px rgba(0,0,0,0.05)'
              }}
              className="h-full pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pl-8 flex flex-col justify-between bg-[#fbf8ee] overflow-hidden"
            >
              {pageAt(rightUnderlayIndex, true) || <div className="h-full select-none" />}
            </div>

            {/* 3D animated leaf while turning or dragging */}
            {isTurning && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '50%',
                  height: '100%',
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${turningState.rotation}deg)`,
                  zIndex: 40,
                  transition: isDraggingRef.current ? 'none' : 'transform 0.36s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
                className="pointer-events-none"
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                    background: BOOK_PAPER.background,
                    boxShadow: 'inset 8px 0 12px -6px rgba(0,0,0,0.05)'
                  }}
                  className="pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pl-8 flex flex-col justify-between overflow-hidden pointer-events-auto select-none"
                >
                  {pageAt(rightLeafIndex, false)}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: BOOK_PAPER.background,
                    boxShadow: 'inset -8px 0 12px -6px rgba(0,0,0,0.05)'
                  }}
                  className="pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pr-8 flex flex-col justify-between overflow-hidden pointer-events-auto select-none"
                >
                  {pageAt(leftLeafIndex, false)}
                </div>
              </div>
            )}

            {/* Bottom-right corner: turn forward */}
            {!isTurning && (
              <div
                onMouseEnter={() => setIsCornerHovered('right')}
                onMouseLeave={() => setIsCornerHovered(null)}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAnimatingRef.current) flipNext()
                }}
                title={nextHint}
                className="group absolute right-0 bottom-0 w-16 h-16 z-50 cursor-pointer flex items-end justify-end p-1 pointer-events-auto select-none"
              >
                <div
                  className={`w-9 h-9 transition-all duration-300 origin-bottom-right ${
                    isCornerHovered === 'right'
                      ? 'scale-125 -translate-x-1.5 -translate-y-1.5 opacity-95'
                      : 'opacity-35 hover:opacity-85'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, transparent 48%, #e2dcce 50%, #fbf8ee 70%, #d8d1be 100%)',
                    filter: isCornerHovered === 'right' ? 'drop-shadow(-3px -3px 5px rgba(0,0,0,0.25))' : 'none',
                    clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
                  }}
                />
              </div>
            )}

            {/* Bottom-left corner: turn backward */}
            {!isTurning && (
              <div
                onMouseEnter={() => setIsCornerHovered('left')}
                onMouseLeave={() => setIsCornerHovered(null)}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAnimatingRef.current) flipPrev()
                }}
                title={prevHint}
                className="group absolute left-0 bottom-0 w-16 h-16 z-50 cursor-pointer flex items-end justify-start p-1 pointer-events-auto select-none"
              >
                <div
                  className={`w-9 h-9 transition-all duration-300 origin-bottom-left ${
                    isCornerHovered === 'left'
                      ? 'scale-125 translate-x-1.5 -translate-y-1.5 opacity-95'
                      : 'opacity-35 hover:opacity-85'
                  }`}
                  style={{
                    background: 'linear-gradient(225deg, transparent 48%, #e2dcce 50%, #fbf8ee 70%, #d8d1be 100%)',
                    filter: isCornerHovered === 'left' ? 'drop-shadow(3px -3px 5px rgba(0,0,0,0.25))' : 'none',
                    clipPath: 'polygon(0 0, 100% 100%, 0 100%)'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
