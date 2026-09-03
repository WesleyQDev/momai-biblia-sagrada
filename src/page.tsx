import React, { useState, useCallback } from 'react'
import { HomeView } from './components/HomeView'
import { RealisticBook } from './components/RealisticBook'
import { BookmarksView } from './components/BookmarksView'
import { BibleDrawer } from './components/BibleDrawer'
import { bibleStorage } from './services/storage'
import { bibleData } from './services/bible-data'
import type { ReadingProgress } from './types/reading'
import type { BibleVerse } from './types/bible'

export const BiblePage: React.FC<{ isActive?: boolean }> = ({ isActive = true }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'reading' | 'bookmarks'>('home')
  const [lastReading, setLastReading] = useState<ReadingProgress>(() => bibleStorage.getLastReading())

  // Current reading passage
  const [currentBookId, setCurrentBookId] = useState<number>(() => lastReading.bookId || 43)
  const [currentChapter, setCurrentChapter] = useState<number>(() => lastReading.chapter || 1)
  const [highlightVerse, setHighlightVerse] = useState<number | undefined>(() => lastReading.verse)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(() => {
    const bms = bibleStorage.getBookmarks()
    const set = new Set<number>()
    bms.forEach((b) => {
      if (b.bookId === (lastReading.bookId || 43) && b.chapter === (lastReading.chapter || 1)) {
        set.add(b.verse)
      }
    })
    return set
  })

  // Sync bookmarks for active book and chapter
  const refreshBookmarksForChapter = useCallback((bId: number, ch: number) => {
    const bms = bibleStorage.getBookmarks()
    const set = new Set<number>()
    bms.forEach((b) => {
      if (b.bookId === bId && b.chapter === ch) {
        set.add(b.verse)
      }
    })
    setBookmarkedSet(set)
  }, [])

  // Sync state whenever lastReading is updated
  const refreshLastReading = useCallback(() => {
    const latest = bibleStorage.getLastReading()
    setLastReading(latest)
  }, [])

  // Navigation handlers
  const handleNavigateToPassage = (bookId: number, chapter: number, verse?: number) => {
    setCurrentBookId(bookId)
    setCurrentChapter(chapter)
    setHighlightVerse(verse)
    setActiveTab('reading')
    refreshBookmarksForChapter(bookId, chapter)

    const b = bibleData.getBookById(bookId)
    if (b) {
      bibleStorage.setLastReading({
        bookId,
        bookName: b.name,
        bookAbbrev: b.abbrev,
        testament: b.testament,
        chapter,
        verse,
        updatedAt: Date.now()
      })
      refreshLastReading()
    }
  }

  const handleNavigateChapter = (bookId: number, chapter: number, verse?: number) => {
    setCurrentBookId(bookId)
    setCurrentChapter(chapter)
    setHighlightVerse(verse)
    refreshBookmarksForChapter(bookId, chapter)

    const b = bibleData.getBookById(bookId)
    if (b) {
      bibleStorage.setLastReading({
        bookId,
        bookName: b.name,
        bookAbbrev: b.abbrev,
        testament: b.testament,
        chapter,
        verse,
        updatedAt: Date.now()
      })
      refreshLastReading()
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
  }

  const handleCopyVerse = (verse: BibleVerse) => {
    const textToCopy = `"${verse.text}" (${verse.bookName} ${verse.chapter}:${verse.verse} - Almeida)`
    navigator.clipboard.writeText(textToCopy)
  }

  const currentBook = bibleData.getBookById(currentBookId) || bibleData.getBookById(43)!
  const currentVerses = bibleData.getChapterVerses(currentBookId, currentChapter)

  const prevStep = bibleData.getPrevChapter(currentBookId, currentChapter)
  const nextStep = bibleData.getNextChapter(currentBookId, currentChapter)

  return (
    <div className="h-full max-h-screen overflow-hidden bg-bg text-text flex flex-col font-sans selection:bg-accent/30 selection:text-text">
      {/* 1. Tela Inicial (Sem Navbar superior, 100% fiel ao print) */}
      {activeTab === 'home' && (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center">
          <HomeView
            onNavigateToPassage={handleNavigateToPassage}
            onOpenBookmarks={() => setActiveTab('bookmarks')}
            lastReading={lastReading}
          />
        </div>
      )}

      {/* 2. Tela de Leitura: Bíblia Realista Aberta com Zíper e 2 Colunas (Conforme Foto 2) */}
      {activeTab === 'reading' && (
        <div className="flex-1 flex flex-col">
          <RealisticBook
            book={currentBook}
            chapter={currentChapter}
            verses={currentVerses}
            highlightedVerse={highlightVerse}
            bookmarkedSet={bookmarkedSet}
            onToggleBookmark={handleToggleBookmark}
            onCopyVerse={handleCopyVerse}
            onNavigateChapter={handleNavigateChapter}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onBackToHome={() => {
              setActiveTab('home')
              refreshLastReading()
            }}
          />
        </div>
      )}

      {/* 3. Tela de Marcadores com Botão de Voltar e Scrollbar Visível */}
      {activeTab === 'bookmarks' && (
        <div className="flex-1 h-full min-h-0 overflow-y-auto w-full bookmarks-scroll-container">
          <style>{`
            .bookmarks-scroll-container {
              scrollbar-width: thin;
              scrollbar-color: rgba(150, 150, 150, 0.45) transparent;
            }
            .bookmarks-scroll-container::-webkit-scrollbar {
              width: 8px;
            }
            .bookmarks-scroll-container::-webkit-scrollbar-track {
              background: transparent;
            }
            .bookmarks-scroll-container::-webkit-scrollbar-thumb {
              background: rgba(150, 150, 150, 0.45);
              border-radius: 9999px;
            }
            .bookmarks-scroll-container::-webkit-scrollbar-thumb:hover {
              background: rgba(150, 150, 150, 0.75);
            }
          `}</style>
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <button
                onClick={() => {
                  setActiveTab('home')
                  refreshLastReading()
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Voltar ao Início</span>
              </button>
            </div>

            <BookmarksView
              onNavigateToPassage={handleNavigateToPassage}
              onStartReading={() => handleNavigateToPassage(currentBookId, currentChapter, highlightVerse)}
            />
          </div>
        </div>
      )}

      {/* Índice Bíblico Lateral Compacto */}
      <BibleDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentBookId={currentBookId}
        currentChapter={currentChapter}
        onSelectPassage={handleNavigateToPassage}
      />
    </div>
  )
}

export default BiblePage
