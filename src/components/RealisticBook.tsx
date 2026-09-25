import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bibleData } from '../services/bible-data'
import { bibleHeadings } from '../services/bible-headings'
import { useBibleI18n } from '../services/i18n'
import { useBibleLanguage } from '../services/useBibleLanguage'
import { getBibleLanguage } from '../services/bible-languages'
import { LanguageMenu } from './LanguageMenu'
import { getBookTitleHierarchy } from '../services/bible-title-hierarchy'
import { BookStage, BOOK_PAPER, type BookPageRenderArgs } from './book/BookStage'
import { useBookPageCapacity } from './book/useBookPageCapacity'
import { copyPageText } from '../services/page-text'
import { bibleStorage } from '../services/storage'
import ContextMenu from './ContextMenu'
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
      type: 'section_heading'
      bookId: number
      bookName: string
      chapter: number
      verse: number
      title: string
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

function pageShowsPassage(
  page: PageData | undefined,
  bookId: number,
  chapter: number
): boolean {
  if (!page || page.bookId !== bookId) return false
  if (page.isBookTitlePage) return chapter === 1
  if (page.startChapter === chapter || page.endChapter === chapter) return true
  if (
    page.startChapter != null &&
    page.endChapter != null &&
    page.startChapter <= chapter &&
    chapter <= page.endChapter
  ) {
    return true
  }
  return page.items.some(
    (item) =>
      (item.type === 'chapter_head' && item.chapter === chapter) ||
      (item.type === 'verse' && item.verse?.chapter === chapter) ||
      (item.type === 'section_heading' && item.chapter === chapter)
  )
}

function spreadShowsPassage(
  left: PageData | undefined,
  right: PageData | undefined,
  bookId: number,
  chapter: number
): boolean {
  return pageShowsPassage(left, bookId, chapter) || pageShowsPassage(right, bookId, chapter)
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
  const { t } = useBibleI18n()
  const { languageId, datasetVersion } = useBibleLanguage()
  const [zoomScale, setZoomScale] = useState(0.95)
  const handleZoomChange = useCallback((updater: (prev: number) => number) => {
    setZoomScale((prev) => updater(prev))
  }, [])

  // Pagination follows the measured sheet box: in windowed mode the columns
  // are narrower than the window estimate assumed, and an over-filled page
  // used to hide its last lines (chapters appeared to vanish).
  const [paperBox, setPaperBox] = useState<{ width: number; height: number } | null>(null)
  const charsPerPage = useBookPageCapacity(paperBox)
  const handlePaperLayout = useCallback((box: { width: number; height: number }) => {
    setPaperBox((prev) =>
      prev && prev.width === box.width && prev.height === box.height ? prev : box
    )
  }, [])

  // FLUXO CONTÍNUO DE TODA A BÍBLIA: todos os 66 livros são paginados juntos em uma única lista contínua (~12ms)
  // Isso elimina 100% de qualquer refresh, unmounting, separação de listas ou páginas duplicadas!
  const pagesData = useMemo(() => {
    const rawBooks = bibleData.getAllBooks()
    const allFlow: (
      | { type: 'book_title'; book: { id: number; name: string } }
      | FlowItem
    )[] = []

    for (const b of rawBooks) {
      allFlow.push({ type: 'book_title', book: { id: b.id, name: b.name } })
      for (let ch = 1; ch <= b.totalChapters; ch++) {
        const chapterHeadings = bibleHeadings.getChapterHeadings(languageId, b.id, ch)
        const v1Heading = chapterHeadings.get(1)

        allFlow.push({
          type: 'chapter_head',
          bookId: b.id,
          bookName: b.name,
          chapter: ch,
          pericope: v1Heading
        })

        const chVerses = bibleData.getChapterVerses(b.id, ch)
        for (const v of chVerses) {
          if (v.verse > 1) {
            const heading = chapterHeadings.get(v.verse)
            if (heading) {
              allFlow.push({
                type: 'section_heading',
                bookId: b.id,
                bookName: b.name,
                chapter: ch,
                verse: v.verse,
                title: heading
              })
            }
          }

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
        charCount += item.pericope ? item.pericope.length + 50 : 35
        continue
      }

      if (item.type === 'section_heading') {
        curItems.push(item)
        charCount += item.title.length + 35
        continue
      }

      const v = item.verse!
      const vText = v.text
      const remaining = charsPerPage - charCount

      // Se o versículo ultrapassa levemente (até 35 caracteres), inclui inteiro na página para evitar quebra órfã
      const slightOverflow = vText.length <= remaining + 35

      // Se o versículo ultrapassa o espaço restante e há texto suficiente para quebrar com elegância
      if (!slightOverflow && vText.length > remaining && remaining > 80) {
        const splitIdx = vText.lastIndexOf(' ', remaining)
        const tailLength = splitIdx > 0 ? vText.length - (splitIdx + 1) : 0

        // Só quebra se tanto a parte anterior quanto a posterior tiverem texto substancial (evita palavras órfãs como "anos")
        if (splitIdx >= 40 && tailLength >= 35) {
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
          charCount = tailLength
          continue
        } else if (tailLength < 35 && curItems.length > 0) {
          // Se a sobra na próxima página seria minúscula (ex: apenas "anos;"), mantém o versículo inteiro nesta página
          curItems.push(item)
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
  }, [charsPerPage, datasetVersion, languageId])

  // Total spreads de toda a Bíblia
  const totalSpreads = Math.ceil(pagesData.length / 2)
  const [currentSpread, setCurrentSpread] = useState(() => {
    let targetIdx = -1
    if (highlightedVerse != null) {
      targetIdx = pagesData.findIndex(
        (p) =>
          p.bookId === book.id &&
          p.items.some(
            (it) =>
              it.type === 'verse' &&
              it.verse?.chapter === chapter &&
              it.verse?.verse === highlightedVerse
          )
      )
    }
    if (targetIdx < 0) {
      targetIdx = pagesData.findIndex(
        (p) =>
          p.bookId === book.id &&
          p.items.some(
            (it) =>
              (it.type === 'chapter_head' && it.chapter === chapter) ||
              (it.type === 'verse' && it.verse?.chapter === chapter)
          )
      )
    }
    return targetIdx >= 0 ? Math.floor(targetIdx / 2) : 0
  })

  const [contextVerse, setContextVerse] = useState<BibleVerse | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [contextPageElement, setContextPageElement] = useState<HTMLElement | null>(null)
  const [contextPageId, setContextPageId] = useState<number | null>(null)
  const [selectionPageId, setSelectionPageId] = useState<number | null>(null)

  // Rastreia a passagem bíblica ativa (livro, capítulo e versículo) para persistir com fidelidade
  const currentPosRef = useRef<{ bookId: number; chapter: number; verse?: number }>({
    bookId: book.id,
    chapter,
    verse: highlightedVerse
  })
  const lastPropsTargetRef = useRef<string>('')
  const pendingSpreadRef = useRef<number | null>(null)

  // 1. Navegação disparada externamente (via menu do Índice, busca ou continuar leitura)
  useEffect(() => {
    const key = `${book.id}-${chapter}-${highlightedVerse || ''}`
    if (lastPropsTargetRef.current === key) return
    lastPropsTargetRef.current = key
    currentPosRef.current = { bookId: book.id, chapter, verse: highlightedVerse }

    if (pagesData.length === 0) return

    const leftP = pagesData[currentSpread * 2]
    const rightP = pagesData[currentSpread * 2 + 1]

    // Se a passagem pedida já estiver visível na abertura atual, não precisa saltar
    const alreadyVisible =
      spreadShowsPassage(leftP, rightP, book.id, chapter) &&
      (highlightedVerse == null ||
        [...(leftP?.items || []), ...(rightP?.items || [])].some(
          (it) =>
            it.type === 'verse' &&
            it.verse?.chapter === chapter &&
            it.verse?.verse === highlightedVerse
        ))

    if (alreadyVisible) return

    let targetIdx = -1
    if (highlightedVerse != null) {
      targetIdx = pagesData.findIndex(
        (p) =>
          p.bookId === book.id &&
          p.items.some(
            (it) =>
              it.type === 'verse' &&
              it.verse?.chapter === chapter &&
              it.verse?.verse === highlightedVerse
          )
      )
    }

    if (targetIdx < 0) {
      targetIdx = pagesData.findIndex(
        (p) =>
          p.bookId === book.id &&
          ((chapter === 1 && p.isBookTitlePage) ||
            p.items.some(
              (it) =>
                (it.type === 'chapter_head' && it.chapter === chapter) ||
                (it.type === 'verse' && it.verse?.chapter === chapter)
            ))
      )
    }

    if (targetIdx >= 0) {
      const targetSpread = Math.floor(targetIdx / 2)
      pendingSpreadRef.current = targetSpread
      setCurrentSpread(targetSpread)
    }
    setContextVerse(null)
    setContextMenuPos(null)
    setSelectionPageId(null)
  }, [book.id, chapter, highlightedVerse, pagesData])

  // 2. Quando a janela muda de tamanho (maximizar / tela cheia / restaurar), reposiciona no mesmo versículo/capítulo.
  const lastPagesDataRef = useRef(pagesData)
  useEffect(() => {
    if (pagesData.length === 0) return
    if (lastPagesDataRef.current === pagesData) return
    lastPagesDataRef.current = pagesData

    const targetB = currentPosRef.current.bookId || book.id
    const targetCh = currentPosRef.current.chapter || chapter
    const targetV = currentPosRef.current.verse ?? highlightedVerse

    let targetIdx = -1
    if (targetV != null) {
      targetIdx = pagesData.findIndex(
        (p) =>
          p.bookId === targetB &&
          p.items.some(
            (it) =>
              it.type === 'verse' &&
              it.verse?.chapter === targetCh &&
              it.verse?.verse === targetV
          )
      )
    }

    if (targetIdx < 0) {
      targetIdx = pagesData.findIndex(
        (p) =>
          p.bookId === targetB &&
          ((targetCh === 1 && p.isBookTitlePage) ||
            p.items.some(
              (it) =>
                (it.type === 'chapter_head' && it.chapter === targetCh) ||
                (it.type === 'verse' && it.verse?.chapter === targetCh)
            ))
      )
    }

    if (targetIdx >= 0) {
      const targetSpread = Math.floor(targetIdx / 2)
      pendingSpreadRef.current = targetSpread
      setCurrentSpread(targetSpread)
    } else {
      setCurrentSpread((prev) => Math.min(Math.max(0, prev), Math.max(0, totalSpreads - 1)))
    }
  }, [pagesData, totalSpreads, book.id, chapter, highlightedVerse])

  // 3. Notifica a aplicação pai sobre o livro, capítulo e versículo ativos atualmente
  useEffect(() => {
    const pending = pendingSpreadRef.current
    if (pending !== null) {
      if (currentSpread !== pending) return
      pendingSpreadRef.current = null
    }

    const leftP = pagesData[currentSpread * 2]
    const rightP = pagesData[currentSpread * 2 + 1]

    const verseItems = [...(leftP?.items || []), ...(rightP?.items || [])].filter(
      (it): it is Extract<FlowItem, { type: 'verse' }> => it.type === 'verse' && it.verse != null
    )

    let activeBId = book.id
    let activeCh = chapter
    let activeV: number | undefined = highlightedVerse

    if (spreadShowsPassage(leftP, rightP, book.id, chapter)) {
      // O spread atual contém a passagem solicitada/ativa
      activeBId = book.id
      activeCh = chapter
      const chapterVerses = verseItems.filter(
        (it) => it.verse.bookId === book.id && it.verse.chapter === chapter
      )
      activeV = chapterVerses[0]?.verse?.verse ?? highlightedVerse
    } else {
      // O leitor avançou para outro capítulo/livro ao virar as páginas
      const firstVerse = verseItems[0]?.verse
      activeBId = firstVerse?.bookId || leftP?.bookId || rightP?.bookId || book.id
      activeCh = firstVerse?.chapter || leftP?.startChapter || rightP?.startChapter || chapter
      activeV = firstVerse?.verse
    }

    const posKey = `${activeBId}-${activeCh}-${highlightedVerse || ''}`
    if (lastPropsTargetRef.current !== posKey) {
      lastPropsTargetRef.current = posKey
      currentPosRef.current = { bookId: activeBId, chapter: activeCh, verse: activeV }
      onNavigateChapter(activeBId, activeCh, activeV)
    }
  }, [currentSpread, pagesData, onNavigateChapter, book.id, chapter, highlightedVerse])

  const closeContextMenu = () => {
    setContextMenuPos(null)
    setContextVerse(null)
    setContextPageElement(null)
  }

  const handleVerseContextMenu = (v: BibleVerse, interactive: boolean, event: React.MouseEvent) => {
    if (!interactive) return
    event.preventDefault()
    event.stopPropagation()
    setContextVerse(v)
    setContextMenuPos({ x: event.clientX, y: event.clientY })
    const pageElement = (event.target as HTMLElement).closest(
      '[data-page-content]'
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
    const page = pagesData[index]
    if (!page) return null

    return (
      <RenderBiblePage
        page={page}
        pageNum={pageNumber}
        activeBookId={book.id}
        activeChapter={chapter}
        bookmarkedSet={bookmarkedSet}
        highlightedVerse={highlightedVerse}
        contextVerse={contextVerse}
        selectionPageId={selectionPageId}
        zoomScale={zoomScale}
        onVerseContextMenu={(v, event) => handleVerseContextMenu(v, interactive, event)}
      />
    )
  }

  const pageFullySelected = contextPageId != null && contextPageId === selectionPageId

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <BookStage
        totalSpreads={totalSpreads}
        spread={currentSpread}
        onSpreadChange={setCurrentSpread}
        renderPage={renderPage}
        onPaperLayout={handlePaperLayout}
        zoomScale={zoomScale}
        onZoomChange={handleZoomChange}
        homeLabel={t('header.home')}
        indexLabel={t('header.index')}
        toolbar={<LanguageMenu />}
        flipHints={{
          next: t('reading.click_flip_next'),
          nextOverflow: book.id < 66 ? t('reading.click_flip_next_book') : t('reading.click_flip_end'),
          nextEnd: t('reading.click_flip_end'),
          prev: t('reading.click_flip_prev'),
          prevOverflow: book.id > 1 ? t('reading.click_flip_prev_book') : t('reading.click_flip_start'),
          prevStart: t('reading.click_flip_start')
        }}
        onBackToHome={onBackToHome}
        onOpenIndex={onOpenDrawer}
        onOverflowForward={
          book.id < 66 ? () => onNavigateChapter(book.id + 1, 1) : undefined
        }
        onOverflowBackward={
          book.id > 1
            ? () => {
                const prevBook = bibleData.getBookById(book.id - 1)
                if (prevBook) onNavigateChapter(prevBook.id, prevBook.totalChapters)
              }
            : undefined
        }
      />

      {/* Selected verse context action menu */}
      {contextMenuPos && contextVerse && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={closeContextMenu}
          items={
            pageFullySelected
              ? [
                  {
                    id: 'copy',
                    label: t('reading.copy'),
                    onClick: () => copyPageText(contextPageElement)
                  },
                  {
                    id: 'select-all',
                    label: t('reading.select_all'),
                    onClick: handleSelectPage
                  }
                ]
              : [
                  {
                    id: 'copy',
                    label: t('reading.copy'),
                    onClick: () => onCopyVerse(contextVerse)
                  },
                  {
                    id: 'bookmark',
                    label: bookmarkedSet.has(contextVerse.verse)
                      ? t('reading.unbookmark')
                      : t('reading.bookmark'),
                    emoji: '⭐',
                    onClick: () => onToggleBookmark(contextVerse)
                  },
                  {
                    id: 'select-all',
                    label: t('reading.select_all'),
                    onClick: handleSelectPage
                  }
                ]
          }
        />
      )}
    </div>
  )
}

// Subcomponent: single page content with full height columns
const RenderBiblePage: React.FC<{
  page: PageData
  pageNum: number
  activeBookId: number
  activeChapter: number
  bookmarkedSet: Set<number>
  highlightedVerse?: number
  contextVerse: BibleVerse | null
  selectionPageId: number | null
  zoomScale: number
  onVerseContextMenu: (v: BibleVerse, event: React.MouseEvent) => void
}> = ({
  page,
  pageNum,
  activeBookId,
  activeChapter,
  bookmarkedSet,
  highlightedVerse,
  contextVerse,
  selectionPageId,
  zoomScale,
  onVerseContextMenu
}) => {
  const { t, getBookName } = useBibleI18n()
  const { languageId } = useBibleLanguage()
  const activeBookName = getBookName(page.bookId, page.bookName || '')
  const translationName = getBibleLanguage(languageId).translationName

  // If this is a dedicated book title page (rendered once per book)
  if (page.isBookTitlePage) {
    const titleInfo = getBookTitleHierarchy(languageId, page.bookId, activeBookName)

    return (
      <div
        className="h-full flex flex-col items-center justify-center text-center p-6 select-none"
        style={{ color: BOOK_PAPER.ink }}
      >
        {titleInfo.subtitle && (
          <span
            className="text-[10px] sm:text-xs md:text-sm font-serif tracking-[0.24em] uppercase font-bold select-none mb-3 opacity-80"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: BOOK_PAPER.ink }}
          >
            {titleInfo.subtitle}
          </span>
        )}
        <h2
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-black tracking-[0.2em] uppercase leading-tight select-none"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: BOOK_PAPER.ink }}
        >
          {titleInfo.title}
        </h2>
        <div
          className="w-16 h-[1.5px] mx-auto mt-5 opacity-60"
          style={{ background: BOOK_PAPER.rule }}
        />
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

  // "Select all" paints every text block of this page with the same custom
  // highlight used on right-click; the native text selection is never used.
  const isPageSelected = selectionPageId === pageNum
  const pageSelectedAttr = isPageSelected ? 'true' : undefined

  return (
    <div className="flex-1 flex flex-col justify-start h-full overflow-hidden font-serif select-none" style={{ color: BOOK_PAPER.ink }}>
      {/* Running header */}
      <div
        className="flex items-center justify-between pb-1 mb-2 border-b text-[11px] font-bold uppercase tracking-wider select-none"
        style={{ color: BOOK_PAPER.ink, borderColor: BOOK_PAPER.rule }}
      >
        <span>{pageNum % 2 !== 0 ? pageNum : ''}</span>
        <span className="tracking-widest">{activeBookName} {headerChapter}</span>
        <span>{pageNum % 2 === 0 ? pageNum : ''}</span>
      </div>

      {/* Two column content area without bottom footer clutter */}
      <div
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
          data-page-content=""
          data-page-id={pageNum}
          className="text-justify select-none pb-3"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `${13 * zoomScale}px`,
            lineHeight: 1.55,
            hyphens: 'auto',
            color: BOOK_PAPER.ink
          }}
        >
          {page.items.map((item, idx) => {
            if (item.type === 'chapter_head') {
              if (!item.pericope) return null
              return (
                <div
                  key={`ch-${item.chapter}-${idx}`}
                  data-page-selected={pageSelectedAttr}
                  className={`break-inside-avoid my-1.5 pt-0.5 text-center rounded select-none ${
                    isPageSelected ? 'bg-accent/10' : ''
                  }`}
                >
                  <h4
                    className="font-serif font-bold italic select-none opacity-90 text-center"
                    style={{ fontSize: `${11.5 * zoomScale}px`, color: BOOK_PAPER.ink }}
                  >
                    {item.pericope}
                  </h4>
                </div>
              )
            }

            if (item.type === 'section_heading') {
              return (
                <div
                  key={`sh-${item.chapter}-${item.verse}-${idx}`}
                  data-page-selected={pageSelectedAttr}
                  className={`break-inside-avoid mt-2.5 mb-1 pt-0.5 rounded select-none ${
                    isPageSelected ? 'bg-accent/10' : ''
                  }`}
                >
                  <h5
                    className="font-serif font-bold italic tracking-tight leading-snug select-none opacity-90"
                    style={{ fontSize: `${11.5 * zoomScale}px`, color: BOOK_PAPER.ink }}
                  >
                    {item.title}
                  </h5>
                </div>
              )
            }

            const v = item.verse
            const isBookmarked = bookmarkedSet.has(v.verse)
            const isHighlighted =
              highlightedVerse != null &&
              highlightedVerse === v.verse &&
              activeBookId === v.bookId &&
              activeChapter === v.chapter
            const isContextSelected =
              !isPageSelected &&
              contextVerse != null &&
              contextVerse.bookId === v.bookId &&
              contextVerse.chapter === v.chapter &&
              contextVerse.verse === v.verse
            const textToRender = item.partialText || v.text
            const isFirstVerseOfChapter = v.verse === 1 && !item.isContinuation
            const chapterNum = item.chapter || v.chapter

            return (
              <React.Fragment key={`${v.id}-${idx}`}>
                {isFirstVerseOfChapter && (
                  <span
                    aria-hidden="true"
                    className="select-none pointer-events-none"
                    style={{
                      float: 'left',
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontSize: `${(chapterNum >= 100 ? 1.9 : chapterNum >= 10 ? 2.3 : 2.55) * zoomScale}rem`,
                      fontWeight: 900,
                      lineHeight: '0.78',
                      marginRight: '6px',
                      marginTop: '2px',
                      marginBottom: '2px',
                      letterSpacing: '-0.04em',
                      color: BOOK_PAPER.ink
                    }}
                  >
                    {chapterNum}
                  </span>
                )}
                <span
                  data-verse={v.verse}
                  onContextMenu={(e) => onVerseContextMenu(v, e)}
                  data-context-selected={isContextSelected ? 'true' : undefined}
                  data-page-selected={pageSelectedAttr}
                  style={{ color: BOOK_PAPER.ink }}
                  className={`inline transition-colors rounded px-0.5 select-none ${
                    isContextSelected
                      ? 'bg-accent/10 ring-1 ring-accent/40'
                      : isHighlighted
                        ? 'bg-amber-300/60 ring-1 ring-amber-500 font-semibold'
                        : isPageSelected
                          ? 'bg-accent/10'
                          : 'hover:bg-[#ede5cc]'
                  }`}
                >
                  {!item.isContinuation && (
                    <b
                      className="font-sans font-bold mr-1 select-none"
                      style={{ fontSize: `${10 * zoomScale}px`, color: BOOK_PAPER.ink }}
                    >
                      {v.verse}
                    </b>
                  )}
                  <span className="select-none" style={{ color: BOOK_PAPER.ink }}>{textToRender} </span>
                  {isBookmarked && !item.isContinuation && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d97706] ml-0.5 align-middle select-none" />
                  )}
                </span>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
