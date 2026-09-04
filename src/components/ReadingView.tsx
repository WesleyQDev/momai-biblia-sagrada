import React, { useState, useEffect, useRef } from 'react'
import { bibleData } from '../services/bible-data'
import { bibleStorage } from '../services/storage'
import { RealisticBook } from './RealisticBook'
import { QuickNavArrows } from './QuickNavArrows'
import ContextMenu from './ContextMenu'
import type { BibleVerse, RawBibleBook } from '../types/bible'

interface ReadingViewProps {
  bookId: number
  chapter: number
  initialVerse?: number
  onNavigateChapter: (bookId: number, chapter: number, verse?: number) => void
  onOpenDrawer: () => void
  onBackToHome?: () => void
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  bookId,
  chapter,
  initialVerse,
  onNavigateChapter,
  onOpenDrawer,
  onBackToHome = () => {}
}) => {
  const [book, setBook] = useState<RawBibleBook | undefined>(() => bibleData.getBookById(bookId))
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [highlightedVerse, setHighlightedVerse] = useState<number | undefined>(initialVerse)
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'3d_book' | 'scroll'>('3d_book')

  // State for scroll mode verse interaction
  const [selectedVerseForAction, setSelectedVerseForAction] = useState<BibleVerse | null>(null)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [verseMenu, setVerseMenu] = useState<{ x: number; y: number; verse: BibleVerse } | null>(null)
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Update book and verses whenever bookId or chapter changes
  useEffect(() => {
    const currentBook = bibleData.getBookById(bookId)
    setBook(currentBook)
    if (currentBook) {
      const vList = bibleData.getChapterVerses(bookId, chapter)
      setVerses(vList)

      // Refresh bookmarks status for this chapter
      const allBookmarks = bibleStorage.getBookmarks()
      const chapterBookmarks = new Set<number>()
      allBookmarks.forEach((b) => {
        if (b.bookId === bookId && b.chapter === chapter) {
          chapterBookmarks.add(b.verse)
        }
      })
      setBookmarkedSet(chapterBookmarks)

      // Save as last reading progress
      bibleStorage.setLastReading({
        bookId,
        bookName: currentBook.name,
        bookAbbrev: currentBook.abbrev,
        testament: currentBook.testament,
        chapter,
        verse: initialVerse || 1,
        updatedAt: Date.now()
      })
    }
  }, [bookId, chapter, initialVerse])

  // Scroll to initial verse in scroll mode
  useEffect(() => {
    if (viewMode === 'scroll' && initialVerse && verseRefs.current.has(initialVerse)) {
      setHighlightedVerse(initialVerse)
      const el = verseRefs.current.get(initialVerse)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      const timer = setTimeout(() => setHighlightedVerse(undefined), 4000)
      return () => clearTimeout(timer)
    }
  }, [initialVerse, verses, viewMode])

  const prevStep = bibleData.getPrevChapter(bookId, chapter)
  const nextStep = bibleData.getNextChapter(bookId, chapter)

  const handlePrev = () => {
    if (prevStep) {
      onNavigateChapter(prevStep.bookId, prevStep.chapter)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (nextStep) {
      onNavigateChapter(nextStep.bookId, nextStep.chapter)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleToggleBookmark = (verse: BibleVerse) => {
    const isMarked = bookmarkedSet.has(verse.verse)
    if (isMarked) {
      bibleStorage.removeBookmark(`${verse.bookAbbrev}-${verse.chapter}-${verse.verse}`)
      setBookmarkedSet((prev) => {
        const next = new Set(prev)
        next.delete(verse.verse)
        return next
      })
    } else {
      bibleStorage.addBookmark({
        bookId: verse.bookId,
        bookName: verse.bookName,
        bookAbbrev: verse.bookAbbrev,
        testament: verse.testament,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text
      })
      setBookmarkedSet((prev) => new Set(prev).add(verse.verse))
    }
    setSelectedVerseForAction(null)
  }

  const handleCopyVerse = (verse: BibleVerse) => {
    const textToCopy = `"${verse.text}" (${verse.bookName} ${verse.chapter}:${verse.verse} - Almeida)`
    navigator.clipboard.writeText(textToCopy)
    setCopyFeedback(true)
    setTimeout(() => {
      setCopyFeedback(false)
      setSelectedVerseForAction(null)
    }, 1500)
  }

  if (!book) {
    return (
      <div className="p-8 text-center text-text-muted">
        Livro não encontrado.
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col justify-between">
      {/* Top View Mode Switcher */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-3 flex items-center justify-end">
        <div className="inline-flex items-center p-1 rounded-xl bg-input/40 border border-border text-xs">
          <button
            onClick={() => setViewMode('3d_book')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === '3d_book'
                ? 'bg-card text-text shadow-sm border border-border font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Livro 3D</span>
          </button>
          <button
            onClick={() => setViewMode('scroll')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'scroll'
                ? 'bg-card text-text shadow-sm border border-border font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Contínuo</span>
          </button>
        </div>
      </div>

      {/* 1. Realistic 3D Interactive Book Mode */}
      {viewMode === '3d_book' && (
        <RealisticBook
          book={book}
          chapter={chapter}
          verses={verses}
          highlightedVerse={highlightedVerse}
          bookmarkedSet={bookmarkedSet}
          onToggleBookmark={handleToggleBookmark}
          onCopyVerse={handleCopyVerse}
          onNavigateChapter={onNavigateChapter}
          onOpenDrawer={onOpenDrawer}
          onBackToHome={onBackToHome}
        />
      )}

      {/* 2. Classic Continuous Scroll View Mode */}
      {viewMode === 'scroll' && (
        <>
          <main className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-8 animate-fade-in">
            {/* Chapter Header */}
            <header className="text-center mb-10 pb-6 border-b border-border/60">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-input/40 text-text-muted mb-2 border border-border">
                <span>{book.testament === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}</span>
                <span>•</span>
                <span>{book.totalChapters} capítulos</span>
              </div>

              <h2
                className="text-3xl sm:text-4xl font-serif font-bold text-black tracking-tight mb-2"
                style={{ color: '#000000' }}
              >
                {book.name}
              </h2>
              <p className="text-sm font-semibold text-black" style={{ color: '#000000' }}>
                Capítulo {chapter}
              </p>
            </header>

            {/* Verses Flow Layout */}
            <div
              className="font-serif text-lg leading-loose text-black space-y-4 select-text"
              style={{ color: '#000000' }}
            >
              {verses.map((v) => {
                const isHighlighted = highlightedVerse === v.verse
                const isBookmarked = bookmarkedSet.has(v.verse)
                const isSelected = selectedVerseForAction?.verse === v.verse

                return (
                  <div
                    key={v.verse}
                    ref={(el) => {
                      if (el) verseRefs.current.set(v.verse, el)
                      else verseRefs.current.delete(v.verse)
                    }}
                    onClick={() =>
                      setSelectedVerseForAction((prev) => (prev?.verse === v.verse ? null : v))
                    }
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setSelectedVerseForAction(v)
                      setVerseMenu({ x: e.clientX, y: e.clientY, verse: v })
                    }}
                    className={`relative group rounded-xl p-2 transition-all cursor-pointer ${
                      isHighlighted
                        ? 'bg-amber-300/60 ring-1 ring-amber-500'
                        : isSelected
                          ? 'bg-black/10 ring-1 ring-black/30'
                          : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="flex items-baseline space-x-2">
                      <span
                        style={{ color: '#000000' }}
                        className={`inline-block font-mono text-xs font-bold select-none min-w-[20px] text-black ${
                          isBookmarked ? 'text-[#d97706]' : 'text-black'
                        }`}
                      >
                        {v.verse}
                      </span>

                      <span
                        className="flex-1 text-black leading-relaxed"
                        style={{ color: '#000000' }}
                      >
                        {v.text}
                      </span>

                      {isBookmarked && (
                        <span
                          title="Versículo marcado"
                          className="inline-block w-2 h-2 rounded-full bg-accent ml-1 self-center"
                        />
                      )}
                    </div>

                    {isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 pt-2 border-t border-border flex items-center justify-between space-x-2 text-xs animate-fade-in"
                      >
                        <span className="font-sans font-semibold text-text-muted text-[11px]">
                          {book.name} {chapter}:{v.verse}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyVerse(v)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-input hover:bg-input/80 text-text border border-border transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{copyFeedback ? 'Copiado!' : 'Copiar'}</span>
                          </button>

                          <button
                            onClick={() => handleToggleBookmark(v)}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition-colors ${
                              isBookmarked
                                ? 'bg-accent/20 text-text border-accent/40'
                                : 'bg-input hover:bg-input/80 text-text border-border'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span>{isBookmarked ? 'Desmarcar' : 'Marcar'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </main>

          <QuickNavArrows
            currentBook={book.name}
            currentChapter={chapter}
            hasPrev={Boolean(prevStep)}
            hasNext={Boolean(nextStep)}
            onPrev={handlePrev}
            onNext={handleNext}
            onOpenDrawer={onOpenDrawer}
          />
        </>
      )}
      {verseMenu && (
        <ContextMenu
          x={verseMenu.x}
          y={verseMenu.y}
          onClose={() => setVerseMenu(null)}
          items={[
            {
              id: 'copy',
              label: 'Copiar versículo',
              shortcut: 'Ctrl+C',
              onClick: () => handleCopyVerse(verseMenu.verse)
            },
            {
              id: 'bookmark',
              label: bookmarkedSet.has(verseMenu.verse.verse) ? 'Desmarcar' : 'Marcar',
              onClick: () => handleToggleBookmark(verseMenu.verse)
            }
          ]}
        />
      )}
    </div>
  )
}
