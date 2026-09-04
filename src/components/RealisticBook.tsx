import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { bibleData } from '../services/bible-data'
import type { BibleVerse, RawBibleBook } from '../types/bible'

interface RealisticBookProps {
  book: RawBibleBook
  chapter: number
  verses?: BibleVerse[]
  highlightedVerse?: number
  bookmarkedSet: Set<number>
  onToggleBookmark: (verse: BibleVerse) => void
  onCopyVerse: (verse: BibleVerse) => void
  onNavigateChapter: (bookId: number, chapter: number, verse?: number) => void
  onOpenDrawer: () => void
  onBackToHome: () => void
}

type FlowItem =
  | {
      type: 'chapter_head'
      bookId?: number
      bookName?: string
      chapter: number
      pericope?: string
    }
  | {
      type: 'verse'
      bookId?: number
      bookName?: string
      chapter?: number
      verse: BibleVerse
      partialText?: string
      isContinuation?: boolean
    }

interface PageData {
  pageNumber: number
  bookId: number
  bookName: string
  isBookTitlePage?: boolean
  nextBookIntro?: RawBibleBook
  items: FlowItem[]
  startChapter?: number
  endChapter?: number
}

// Well-known pericope titles for prominent chapters
const chapterTitles: Record<string, string> = {
  'sl-1': 'O justo e o ímpio',
  'sl-19': 'As obras e a lei de Deus',
  'sl-20': 'Oração pelo rei, antes da batalha',
  'sl-21': 'Ação de graças, após a vitória',
  'sl-22': 'Visão profética dos sofrimentos do servo do Senhor',
  'sl-23': 'O Senhor é o meu pastor',
  'sl-91': 'A segurança daquele que confia em Deus',
  'sl-119': 'As excelências da lei divina',
  'sl-121': 'O auxílio que vem do Senhor',
  'gn-1': 'A criação dos céus e da terra',
  'gn-2': 'O jardim do Éden e a criação do homem',
  'is-40': 'A consolação do povo de Deus',
  'is-53': 'O servo sofredor',
  'mt-1': 'A genealogia e o nascimento de Jesus Cristo',
  'mt-5': 'O Sermão da Montanha • As Bem-Aventuranças',
  'mt-6': 'Oração do Pai Nosso e a confiança em Deus',
  'mt-28': 'A ressurreição e a grande comissão',
  'jo-1': 'O Verbo feito carne',
  'jo-3': 'A conversa com Nicodemos • O amor de Deus',
  'jo-14': 'O caminho, a verdade e a vida',
  'rm-8': 'A vida no Espírito e a vitória em Cristo',
  'rm-12': 'A vida consagrada a Deus',
  '1co-13': 'O hino ao amor',
  'hb-11': 'Os heróis da fé',
  'ap-21': 'O novo céu e a nova terra',
  'ap-22': 'O rio da água da vida e a promessa da vinda'
}

export const RealisticBook: React.FC<RealisticBookProps> = ({
  book,
  chapter,
  highlightedVerse,
  bookmarkedSet,
  onToggleBookmark,
  onCopyVerse,
  onNavigateChapter,
  onOpenDrawer,
  onBackToHome
}) => {
  // Monitoramento da altura da janela para que as folhas fiquem 100% cheias e responsivas
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  )

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Capacidade de caracteres calculada dinamicamente para tela cheia e janelas normais
  const charsPerPage = useMemo(() => {
    const availableH = Math.min(860, windowHeight - 90) - 52
    const linesPerCol = Math.max(16, Math.floor(availableH / 21.2))
    return Math.round(linesPerCol * 2 * 36.5)
  }, [windowHeight])

  // FLUXO CONTÍNUO DE TODA A BÍBLIA: todos os 66 livros são paginados juntos em uma única lista contínua (~12ms)
  // Isso elimina 100% de qualquer refresh, unmounting, separação de listas ou páginas duplicadas!
  const allBiblePages = useMemo(() => {
    const rawBooks = bibleData.getAllBooks()
    const allFlow: (
      | { type: 'book_title'; book: { id: number; name: string } }
      | FlowItem
    )[] = []

    for (const b of rawBooks) {
      allFlow.push({ type: 'book_title', book: { id: b.id, name: b.name } })
      for (let ch = 1; ch <= b.totalChapters; ch++) {
        const pericope = chapterTitles[`${b.abbrev}-${ch}`]
        allFlow.push({
          type: 'chapter_head',
          bookId: b.id,
          bookName: b.name,
          chapter: ch,
          pericope
        })

        const chVerses = bibleData.getChapterVerses(b.id, ch)
        for (const v of chVerses) {
          allFlow.push({
            type: 'verse',
            bookId: b.id,
            bookName: b.name,
            chapter: ch,
            verse: v
          })
        }
      }
    }

    const pages: PageData[] = []
    let curItems: FlowItem[] = []
    let charCount = 0
    let pageNum = 1

    for (let i = 0; i < allFlow.length; i++) {
      const item = allFlow[i]

      // Cada novo livro inicia com sua folha de rosto dedicada e limpa
      if (item.type === 'book_title') {
        if (curItems.length > 0) {
          const startCh = curItems.find((it) => it.type === 'verse')?.verse?.chapter || 1
          const endCh = [...curItems].reverse().find((it) => it.type === 'verse')?.verse?.chapter || startCh
          const bId = curItems.find((it) => it.bookId)?.bookId || item.book.id
          const bName = curItems.find((it) => it.bookName)?.bookName || item.book.name

          pages.push({
            pageNumber: pageNum++,
            bookId: bId,
            bookName: bName,
            items: [...curItems],
            startChapter: startCh,
            endChapter: endCh
          })
          curItems = []
          charCount = 0
        }

        // Folha de rosto do livro (renderizada estritamente uma única vez na Bíblia inteira)
        pages.push({
          pageNumber: pageNum++,
          bookId: item.book.id,
          bookName: item.book.name,
          isBookTitlePage: true,
          items: []
        })
        continue
      }

      if (item.type === 'chapter_head') {
        curItems.push(item)
        charCount += item.pericope ? 220 : 160
        continue
      }

      const v = item.verse!
      const vText = v.text
      const remaining = charsPerPage - charCount

      // Se o versículo ultrapassa o espaço restante e há texto suficiente para quebrar com elegância (> 80 chars)
      if (vText.length > remaining && remaining > 80) {
        const splitIdx = vText.lastIndexOf(' ', remaining)
        if (splitIdx > 35) {
          curItems.push({
            type: 'verse',
            bookId: item.bookId,
            bookName: item.bookName,
            chapter: item.chapter,
            verse: v,
            partialText: vText.slice(0, splitIdx)
          })

          const startCh = curItems.find((it) => it.type === 'verse')?.verse?.chapter || 1
          const endCh = [...curItems].reverse().find((it) => it.type === 'verse')?.verse?.chapter || startCh

          pages.push({
            pageNumber: pageNum++,
            bookId: item.bookId || 1,
            bookName: item.bookName || '',
            items: [...curItems],
            startChapter: startCh,
            endChapter: endCh
          })

          curItems = [
            {
              type: 'verse',
              bookId: item.bookId,
              bookName: item.bookName,
              chapter: item.chapter,
              verse: v,
              partialText: vText.slice(splitIdx + 1),
              isContinuation: true
            }
          ]
          charCount = vText.length - splitIdx
          continue
        }
      }

      curItems.push(item)
      charCount += vText.length

      if (charCount >= charsPerPage || i === allFlow.length - 1) {
        const startCh = curItems.find((it) => it.type === 'verse')?.verse?.chapter || 1
        const endCh = [...curItems].reverse().find((it) => it.type === 'verse')?.verse?.chapter || startCh

        pages.push({
          pageNumber: pageNum++,
          bookId: item.bookId || 1,
          bookName: item.bookName || '',
          items: [...curItems],
          startChapter: startCh,
          endChapter: endCh
        })
        curItems = []
        charCount = 0
      }
    }

    if (curItems.length > 0) {
      const startCh = curItems.find((it) => it.type === 'verse')?.verse?.chapter || 1
      const endCh = [...curItems].reverse().find((it) => it.type === 'verse')?.verse?.chapter || startCh
      const lastB = curItems.find((it) => it.bookId)
      pages.push({
        pageNumber: pageNum++,
        bookId: lastB?.bookId || 66,
        bookName: lastB?.bookName || 'Apocalipse',
        items: [...curItems],
        startChapter: startCh,
        endChapter: endCh
      })
    }

    // Se o total de páginas for ímpar, adiciona uma folha final para fechar a abertura dupla perfeitamente
    if (pages.length % 2 !== 0) {
      pages.push({
        pageNumber: pageNum++,
        bookId: 66,
        bookName: 'Apocalipse',
        items: []
      })
    }

    return pages
  }, [charsPerPage])

  const pagesData = allBiblePages

  // Total spreads de toda a Bíblia
  const totalSpreads = Math.ceil(pagesData.length / 2)
  const [currentSpread, setCurrentSpread] = useState(0)

  // Interactive turning leaf state
  const [turningState, setTurningState] = useState<{
    isTurning: boolean
    direction: 'forward' | 'backward'
    rotation: number
  }>({
    isTurning: false,
    direction: 'forward',
    rotation: 0
  })

  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [isCornerHovered, setIsCornerHovered] = useState<'left' | 'right' | null>(null)

  // Drag tracking refs
  const isDraggingRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const isAnimatingRef = useRef(false)
  const currentRotationRef = useRef(0)
  const turningDirectionRef = useRef<'forward' | 'backward'>('forward')
  const startXRef = useRef(0)
  const bookRef = useRef<HTMLDivElement>(null)

  // Rastreia a passagem bíblica ativa (livro e capítulo) para persistir com fidelidade em redimensionamento de janela
  const currentPosRef = useRef<{ bookId: number; chapter: number }>({
    bookId: book.id,
    chapter
  })
  const lastPropsTargetRef = useRef<string>('')

  // 1. Navegação disparada externamente (via menu do Índice ou tela inicial)
  useEffect(() => {
    const key = `${book.id}-${chapter}`
    if (lastPropsTargetRef.current === key) return
    lastPropsTargetRef.current = key
    currentPosRef.current = { bookId: book.id, chapter }

    if (pagesData.length === 0) return
    const targetIdx = pagesData.findIndex(
      (p) =>
        p.bookId === book.id &&
        ((chapter === 1 && p.isBookTitlePage) ||
          p.startChapter === chapter ||
          p.items.some(
            (it) =>
              (it.type === 'chapter_head' && it.chapter === chapter) ||
              (it.type === 'verse' && it.verse?.chapter === chapter)
          ))
    )

    if (targetIdx >= 0) {
      setCurrentSpread(Math.floor(targetIdx / 2))
    }
    setSelectedVerse(null)
  }, [book.id, chapter])

  // 2. Quando a janela muda de tamanho (maximizar / tela cheia / restaurar), reposiciona no mesmo livro e capítulo
  useEffect(() => {
    if (pagesData.length === 0) return
    const targetB = currentPosRef.current.bookId || book.id
    const targetCh = currentPosRef.current.chapter || chapter

    const targetIdx = pagesData.findIndex(
      (p) =>
        p.bookId === targetB &&
        ((targetCh === 1 && p.isBookTitlePage) ||
          p.startChapter === targetCh ||
          p.items.some(
            (it) =>
              (it.type === 'chapter_head' && it.chapter === targetCh) ||
              (it.type === 'verse' && it.verse?.chapter === targetCh)
          ))
    )

    if (targetIdx >= 0) {
      setCurrentSpread(Math.floor(targetIdx / 2))
    } else {
      setCurrentSpread((prev) => Math.min(Math.max(0, prev), Math.max(0, totalSpreads - 1)))
    }
  }, [pagesData, totalSpreads])

  // 3. Notifica suavemente a aplicação pai sobre o livro e capítulo visíveis atualmente sem causar refresh
  useEffect(() => {
    const leftP = pagesData[currentSpread * 2]
    const rightP = pagesData[currentSpread * 2 + 1]
    const activeBId = leftP?.bookId || rightP?.bookId
    const activeCh = leftP?.startChapter || rightP?.startChapter || 1
    if (activeBId) {
      currentPosRef.current = { bookId: activeBId, chapter: activeCh }
      const posKey = `${activeBId}-${activeCh}`
      if (lastPropsTargetRef.current !== posKey) {
        lastPropsTargetRef.current = posKey
        onNavigateChapter(activeBId, activeCh)
      }
    }
  }, [currentSpread, pagesData, onNavigateChapter])

  // Flip forward: animação suave e física com delay natural (360ms) sem pular páginas
  const flipNext = useCallback(() => {
    if (turningState.isTurning || isAnimatingRef.current) return
    if (currentSpread >= totalSpreads - 1) return

    isAnimatingRef.current = true
    setTurningState({ isTurning: true, direction: 'forward', rotation: 0 })

    requestAnimationFrame(() => {
      setTurningState({ isTurning: true, direction: 'forward', rotation: -180 })
    })

    setTimeout(() => {
      setCurrentSpread((prev) => Math.min(totalSpreads - 1, prev + 1))
      setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
      isAnimatingRef.current = false
    }, 360)
  }, [currentSpread, totalSpreads, turningState.isTurning])

  // Flip backward: animação suave e física com delay natural (360ms) sem pular páginas
  const flipPrev = useCallback(() => {
    if (turningState.isTurning || isAnimatingRef.current) return
    if (currentSpread <= 0) return

    isAnimatingRef.current = true
    setTurningState({ isTurning: true, direction: 'backward', rotation: -180 })

    requestAnimationFrame(() => {
      setTurningState({ isTurning: true, direction: 'backward', rotation: 0 })
    })

    setTimeout(() => {
      setCurrentSpread((prev) => Math.max(0, prev - 1))
      setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
      isAnimatingRef.current = false
    }, 360)
  }, [currentSpread, turningState.isTurning])

  // Touch and mouse drag handlers
  const getClientX = (e: MouseEvent | TouchEvent) => {
    return 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as MouseEvent).clientX
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (turningState.isTurning || isAnimatingRef.current) return
    const nativeEvent = e.nativeEvent
    const clientX = getClientX(nativeEvent)
    if (!bookRef.current) return

    const rect = bookRef.current.getBoundingClientRect()
    const midPoint = rect.left + rect.width / 2

    let direction: 'forward' | 'backward' = 'forward'
    if (clientX > midPoint && currentSpread < totalSpreads - 1) {
      direction = 'forward'
    } else if (clientX <= midPoint && currentSpread > 0) {
      direction = 'backward'
    } else {
      return
    }

    isDraggingRef.current = true
    hasDraggedRef.current = false
    turningDirectionRef.current = direction
    startXRef.current = clientX
    const initialRot = direction === 'forward' ? 0 : -180
    currentRotationRef.current = initialRot

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return
      const curX = getClientX(moveEvent)
      const deltaX = curX - startXRef.current

      // Ativa o modo de virada 3D apenas se o mouse realmente se mover mais de 8px (evita sequestrar cliques nos versículos)
      if (!hasDraggedRef.current && Math.abs(deltaX) > 8) {
        hasDraggedRef.current = true
      }
      if (!hasDraggedRef.current) return

      const progress = Math.max(-1, Math.min(1, deltaX / 280))

      let rot = 0
      if (direction === 'forward') {
        rot = Math.max(-180, Math.min(0, progress * 180))
      } else {
        rot = Math.max(-180, Math.min(0, -180 + progress * 180))
      }

      currentRotationRef.current = rot
      setTurningState({ isTurning: true, direction, rotation: rot })
    }

    const handleEnd = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false

      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchend', handleEnd)

      if (!hasDraggedRef.current) {
        return
      }

      // Complete drag deterministically with EXACTLY ONE TIMEOUT
      isAnimatingRef.current = true
      const dir = turningDirectionRef.current
      const finalRot = currentRotationRef.current

      if (dir === 'forward') {
        if (finalRot < -45) {
          // Finish turn forward: advance spread or advance book
          setTurningState({ isTurning: true, direction: 'forward', rotation: -180 })
          setTimeout(() => {
            if (currentSpread < totalSpreads - 1) {
              setCurrentSpread((c) => Math.min(totalSpreads - 1, c + 1))
              setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
              isAnimatingRef.current = false
            } else if (book.id < 66) {
              onNavigateChapter(book.id + 1, 1)
              setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
              isAnimatingRef.current = false
            } else {
              setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
              isAnimatingRef.current = false
            }
          }, 460)
        } else {
          // Snap back to original
          setTurningState({ isTurning: true, direction: 'forward', rotation: 0 })
          setTimeout(() => {
            setTurningState({ isTurning: false, direction: 'forward', rotation: 0 })
            isAnimatingRef.current = false
          }, 460)
        }
      } else {
        if (finalRot > -135) {
          // Finish turn backward: return spread or return to prev book
          setTurningState({ isTurning: true, direction: 'backward', rotation: 0 })
          setTimeout(() => {
            if (currentSpread > 0) {
              setCurrentSpread((c) => Math.max(0, c - 1))
              setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
              isAnimatingRef.current = false
            } else if (book.id > 1) {
              const prevB = bibleData.getBookById(book.id - 1)
              if (prevB) {
                onNavigateChapter(prevB.id, prevB.totalChapters)
              }
              setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
              isAnimatingRef.current = false
            } else {
              setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
              isAnimatingRef.current = false
            }
          }, 460)
        } else {
          // Snap back to original
          setTurningState({ isTurning: true, direction: 'backward', rotation: -180 })
          setTimeout(() => {
            setTurningState({ isTurning: false, direction: 'backward', rotation: 0 })
            isAnimatingRef.current = false
          }, 460)
        }
      }
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchmove', handleMove, { passive: true })
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchend', handleEnd)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === 'ArrowRight') flipNext()
      else if (e.key === 'ArrowLeft') flipPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipNext, flipPrev])

  const handleCopy = (v: BibleVerse) => {
    onCopyVerse(v)
    setCopyFeedback(true)
    setTimeout(() => {
      setCopyFeedback(false)
      setSelectedVerse(null)
    }, 1200)
  }

  // Active spread pages when resting
  const leftPage = pagesData[currentSpread * 2]
  const rightPage = pagesData[currentSpread * 2 + 1]

  // PHYSICAL PEEKING MECHANISM:
  // When turning forward: right underlay displays next right page
  const rightUnderlayWhenTurning =
    turningState.isTurning && turningState.direction === 'forward'
      ? (currentSpread < totalSpreads - 1 ? pagesData[(currentSpread + 1) * 2 + 1] : null)
      : rightPage

  // When turning backward: left underlay displays previous left page
  const leftUnderlayWhenTurning =
    turningState.isTurning && turningState.direction === 'backward'
      ? (currentSpread > 0 ? pagesData[(currentSpread - 1) * 2] : null)
      : leftPage

  // Pages rendered on the animated flipping leaf
  const nextLeftPage = pagesData[(currentSpread + 1) * 2]
  const prevRightPage = pagesData[(currentSpread - 1) * 2 + 1]

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col justify-between py-2 px-2 sm:px-4 select-none">
      {/* 1. Top Bar: Início + Índice (Sem indicador de páginas no topo) */}
      <div className="w-full max-w-6xl mx-auto px-2 h-9 shrink-0 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all active:scale-95 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Início</span>
        </button>

        <button
          onClick={onOpenDrawer}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span>Índice</span>
        </button>
      </div>

      {/* 2. Main 3D Book Stage: Centralizado Verticalmente */}
      <div
        style={{
          perspective: '2200px',
          perspectiveOrigin: '50% 50%'
        }}
        className="flex-1 min-h-0 w-full max-w-6xl mx-auto flex items-center justify-center my-auto"
      >
        {/* Leather Case Outline */}
        <div
          className="relative rounded-[20px] sm:rounded-[26px] py-1.5 sm:py-2 px-2 sm:px-3 shadow-2xl border-4 border-[#1f2937]/90 w-full"
          style={{
            background: 'linear-gradient(145deg, #111827 0%, #1f2937 40%, #030712 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), inset 0 2px 4px rgba(255,255,255,0.1)'
          }}
        >
          {/* Simulated Zipper Stitching */}
          <div className="absolute inset-1 sm:inset-1.5 rounded-[16px] sm:rounded-[22px] pointer-events-none border border-dashed border-[#4b5563]/60 opacity-60" />

          {/* Open Book Platform */}
          <div
            ref={bookRef}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            style={{
              transformStyle: 'preserve-3d',
              height: 'min(860px, calc(100vh - 90px))',
              background: '#fbf8ee',
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
            {/* LINHA CENTRAL SUAVE: 1px sutil e sem sombras pesadas sobre o texto */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#e2dcce] z-30 pointer-events-none" />

            {/* Left Page Underlay */}
            <div
              style={{
                width: '50%',
                boxShadow: 'inset -8px 0 12px -6px rgba(0,0,0,0.05)'
              }}
              className="h-full pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pr-8 flex flex-col justify-between bg-[#fbf8ee] overflow-hidden"
            >
              {leftUnderlayWhenTurning && (
                <RenderBiblePage
                  page={leftUnderlayWhenTurning}
                  bookName={book.name}
                  pageNum={
                    turningState.isTurning && turningState.direction === 'backward'
                      ? (currentSpread - 1) * 2 + 1
                      : currentSpread * 2 + 1
                  }
                  bookmarkedSet={bookmarkedSet}
                  highlightedVerse={highlightedVerse}
                  onVerseClick={(v) =>
                    setSelectedVerse((prev) =>
                      prev && prev.bookId === v.bookId && prev.chapter === v.chapter && prev.verse === v.verse ? null : v
                    )
                  }
                />
              )}
            </div>

            {/* Right Page Underlay */}
            <div
              style={{
                width: '50%',
                boxShadow: 'inset 8px 0 12px -6px rgba(0,0,0,0.05)'
              }}
              className="h-full pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pl-8 flex flex-col justify-between bg-[#fbf8ee] overflow-hidden"
            >
              {rightUnderlayWhenTurning ? (
                <RenderBiblePage
                  page={rightUnderlayWhenTurning}
                  pageNum={
                    turningState.isTurning && turningState.direction === 'forward'
                      ? (currentSpread + 1) * 2 + 2
                      : currentSpread * 2 + 2
                  }
                  bookmarkedSet={bookmarkedSet}
                  highlightedVerse={highlightedVerse}
                  onVerseClick={(v) =>
                    setSelectedVerse((prev) =>
                      prev && prev.bookId === v.bookId && prev.chapter === v.chapter && prev.verse === v.verse ? null : v
                    )
                  }
                />
              ) : (
                <div className="h-full select-none" />
              )}
            </div>

            {/* 3D Animated Flipping Leaf during turn / drag */}
            {turningState.isTurning && (
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
                {/* Front of leaf: Right Page being turned */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                    background: '#fbf8ee',
                    boxShadow: 'inset 8px 0 12px -6px rgba(0,0,0,0.05)'
                  }}
                  className="pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pl-8 flex flex-col justify-between overflow-hidden pointer-events-auto select-none"
                >
                  {turningState.direction === 'forward' && rightPage && (
                    <RenderBiblePage
                      page={rightPage}
                      pageNum={currentSpread * 2 + 2}
                      bookmarkedSet={bookmarkedSet}
                      highlightedVerse={highlightedVerse}
                      onVerseClick={() => {}}
                    />
                  )}
                  {turningState.direction === 'backward' && prevRightPage && (
                    <RenderBiblePage
                      page={prevRightPage}
                      pageNum={currentSpread * 2}
                      bookmarkedSet={bookmarkedSet}
                      highlightedVerse={highlightedVerse}
                      onVerseClick={() => {}}
                    />
                  )}
                </div>

                {/* Back of leaf: Next Left Page swinging in */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#fbf8ee',
                    boxShadow: 'inset -8px 0 12px -6px rgba(0,0,0,0.05)'
                  }}
                  className="pt-2.5 sm:pt-3.5 pb-2 px-5 sm:px-7 md:pr-8 flex flex-col justify-between overflow-hidden pointer-events-auto select-none"
                >
                  {turningState.direction === 'forward' && nextLeftPage && (
                    <RenderBiblePage
                      page={nextLeftPage}
                      pageNum={(currentSpread + 1) * 2 + 1}
                      bookmarkedSet={bookmarkedSet}
                      highlightedVerse={highlightedVerse}
                      onVerseClick={() => {}}
                    />
                  )}
                  {turningState.direction === 'backward' && leftPage && (
                    <RenderBiblePage
                      page={leftPage}
                      pageNum={currentSpread * 2 + 1}
                      bookmarkedSet={bookmarkedSet}
                      highlightedVerse={highlightedVerse}
                      onVerseClick={() => {}}
                    />
                  )}
                </div>
              </div>
            )}

            {/* QUINA DIREITA INFERIOR: Animação e Clique Imediato */}
            {!turningState.isTurning && (
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
                  if (!isAnimatingRef.current) {
                    flipNext()
                  }
                }}
                title={
                  currentSpread < totalSpreads - 1
                    ? 'Clique para virar a página'
                    : book.id < 66
                      ? 'Clique para o próximo livro'
                      : 'Fim do livro'
                }
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

            {/* QUINA ESQUERDA INFERIOR: Animação e Clique Imediato para Voltar */}
            {!turningState.isTurning && (
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
                  if (!isAnimatingRef.current) {
                    flipPrev()
                  }
                }}
                title={
                  currentSpread > 0
                    ? 'Clique para voltar a página'
                    : book.id > 1
                      ? 'Clique para o livro anterior'
                      : 'Início da Bíblia'
                }
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

      {/* 3. Selected Verse Context Action Menu Popup */}
      {selectedVerse && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 max-w-md w-[92vw] mx-auto animate-slide-in-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text">
              {selectedVerse.bookName || book.name} {selectedVerse.chapter}:{selectedVerse.verse}
            </span>
            <button
              onClick={() => setSelectedVerse(null)}
              className="p-1 text-text-muted hover:text-text rounded-lg cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs italic font-serif text-text-muted line-clamp-2 mb-3">
            "{selectedVerse.text}"
          </p>
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleCopy(selectedVerse)}
              className="px-3 py-1.5 rounded-xl bg-input hover:bg-input/80 border border-border text-xs font-medium text-text flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{copyFeedback ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={() => {
                onToggleBookmark(selectedVerse)
                setSelectedVerse(null)
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                bookmarkedSet.has(selectedVerse.verse)
                  ? 'bg-accent/20 border-accent/40 text-text'
                  : 'bg-input hover:bg-input/80 border-border text-text'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{bookmarkedSet.has(selectedVerse.verse) ? 'Desmarcar' : 'Marcar'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Subcomponent: Single Page Content with Full Height Columns (100% select-none)
const RenderBiblePage: React.FC<{
  page: PageData
  bookName?: string
  pageNum: number
  bookmarkedSet: Set<number>
  highlightedVerse?: number
  onVerseClick: (v: BibleVerse) => void
}> = ({
  page,
  bookName,
  pageNum,
  bookmarkedSet,
  highlightedVerse,
  onVerseClick
}) => {
  const activeBookName = page.bookName || bookName || ''

  // If this is a dedicated book title page (rendered once per book)
  if (page.isBookTitlePage) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none" style={{ color: '#000000' }}>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-black tracking-[0.2em] uppercase leading-tight select-none"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: '#000000' }}
        >
          {activeBookName}
        </h2>
        {/* Almeida Revista e Atualizada apenas abaixo do nome do livro */}
        <span
          className="mt-3 text-xs sm:text-sm font-sans tracking-[0.16em] text-black uppercase font-medium select-none"
          style={{ color: '#000000' }}
        >
          Almeida Revista e Atualizada
        </span>
      </div>
    )
  }

  // Folha limpa sem texto
  if (page.items.length === 0) {
    return <div className="h-full select-none" />
  }

  const headerChapter =
    page.startChapter && page.endChapter && page.startChapter !== page.endChapter
      ? `${page.startChapter}-${page.endChapter}`
      : String(page.startChapter || 1)

  return (
    <div className="flex-1 flex flex-col justify-start h-full overflow-hidden text-black font-serif select-none" style={{ color: '#000000' }}>
      {/* Running Header */}
      <div
        className="flex items-center justify-between pb-1 mb-2 border-b border-[#e5dfd2] text-[11px] font-bold text-black uppercase tracking-wider select-none"
        style={{ color: '#000000' }}
      >
        <span>{pageNum % 2 !== 0 ? pageNum : ''}</span>
        <span className="tracking-widest">{activeBookName} {headerChapter}</span>
        <span>{pageNum % 2 === 0 ? pageNum : ''}</span>
      </div>

      {/* Two Column Content Area without Bottom Footer Clutter */}
      <div
        style={{
          overflow: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          color: '#000000'
        }}
        className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start select-none text-black"
      >
        <div
          className="columns-1 sm:columns-2 gap-5 text-[12px] sm:text-[13px] leading-[1.62] text-black text-justify select-none"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            hyphens: 'auto',
            color: '#000000'
          }}
        >
          {page.items.map((item, idx) => {
            if (item.type === 'chapter_head') {
              return (
                <div key={`ch-${item.chapter}-${idx}`} className="break-inside-avoid mb-2 pt-1 first:pt-0 select-none">
                  {item.pericope && (
                    <h4
                      className="text-[11px] font-serif font-bold text-black italic mb-0.5 select-none"
                      style={{ color: '#000000' }}
                    >
                      {item.pericope}
                    </h4>
                  )}
                  {/* Apenas o número do capítulo limpo, sem texto ao lado */}
                  <div className="select-none">
                    <span
                      className="text-3xl sm:text-4xl font-serif font-black text-black leading-none select-none tracking-tighter inline-block"
                      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: '#000000' }}
                    >
                      {item.chapter}
                    </span>
                  </div>
                </div>
              )
            }

            const v = item.verse
            const isBookmarked = bookmarkedSet.has(v.verse)
            const isHighlighted = highlightedVerse === v.verse
            const textToRender = item.partialText || v.text

            return (
              <span
                key={`${v.id}-${idx}`}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onVerseClick(v)
                }}
                style={{ color: '#000000' }}
                className={`inline cursor-pointer transition-colors rounded px-0.5 select-none text-black ${
                  isHighlighted
                    ? 'bg-amber-300/60 ring-1 ring-amber-500 font-semibold'
                    : 'hover:bg-[#ede5cc]'
                }`}
              >
                {!item.isContinuation && (
                  <b
                    className="font-sans font-bold text-[10px] text-black mr-1 select-none"
                    style={{ color: '#000000' }}
                  >
                    {v.verse}
                  </b>
                )}
                <span className="select-none text-black" style={{ color: '#000000' }}>{textToRender} </span>
                {isBookmarked && !item.isContinuation && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d97706] ml-0.5 align-middle select-none" />
                )}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
