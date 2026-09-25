import React, { useState, useCallback, useEffect } from 'react'
import { HomeView } from './components/HomeView'
import { RealisticBook } from './components/RealisticBook'
import { BookmarksView } from './components/BookmarksView'
import { BibleDrawer } from './components/BibleDrawer'
import { HarpaBook } from './components/HarpaBook'
import { HarpaDrawer } from './components/HarpaDrawer'
import { bibleStorage } from './services/storage'
import { bibleData } from './services/bible-data'
import { harpaData } from './services/harpa-data'
import pageBackground from '../assets/backgrounds/page-bg.png'
import { useBibleI18n } from './services/i18n'
import { useBibleLanguage } from './services/useBibleLanguage'
import { getBibleLanguage } from './services/bible-languages'
import type { ReadingProgress } from './types/reading'
import type { BibleVerse } from './types/bible'
import type { HarpaHymn } from './types/harpa'

export const BiblePage: React.FC<{ isActive?: boolean; locale?: string }> = ({
  isActive = true,
  locale: propLocale
}) => {
  const { t, getBookName } = useBibleI18n(propLocale)
  // Re-renders reading state (book names, verses) on Bible language switches
  const { languageId } = useBibleLanguage()
  const translationShort = getBibleLanguage(languageId).translationShort
  const [activeTab, setActiveTab] = useState<'home' | 'reading' | 'bookmarks' | 'harpa'>('home')
  const [lastReading, setLastReading] = useState<ReadingProgress>(() => bibleStorage.getLastReading())

  // Current reading passage
  const [currentBookId, setCurrentBookId] = useState<number>(() => lastReading.bookId || 43)
  const [currentChapter, setCurrentChapter] = useState<number>(() => lastReading.chapter || 1)
  const [highlightVerse, setHighlightVerse] = useState<number | undefined>(undefined)
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

  // Harpa Cristã reading state
  const [currentHymn, setCurrentHymn] = useState<number>(() => bibleStorage.getLastHymn())
  const [isHarpaDrawerOpen, setIsHarpaDrawerOpen] = useState(false)
  const [hymnFavorites, setHymnFavorites] = useState<Set<number>>(
    () => new Set(bibleStorage.getHymnFavorites())
  )

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

  // Check pending navigation from widgets / external triggers
  useEffect(() => {
    const checkPending = () => {
      try {
        const raw = sessionStorage.getItem('momai_biblia_pending_nav')
        if (raw) {
          sessionStorage.removeItem('momai_biblia_pending_nav')
          const nav = JSON.parse(raw)
          if (nav.bookId && nav.chapter) {
            handleNavigateToPassage(nav.bookId, nav.chapter, nav.verse)
          }
        }
      } catch {}
    }

    checkPending()

    const handleNavigateEvent = (e: Event) => {
      const customEv = e as CustomEvent<{
        bookId?: number
        chapter?: number
        verse?: number
        tab?: 'reading' | 'home' | 'bookmarks' | 'harpa'
      }>
      if (customEv.detail) {
        const { bookId, chapter, verse, tab } = customEv.detail
        if (bookId && chapter) {
          handleNavigateToPassage(bookId, chapter, verse)
        } else if (tab) {
          setActiveTab(tab)
        }
      }
    }

    window.addEventListener('momai_biblia_navigate', handleNavigateEvent)
    return () => {
      window.removeEventListener('momai_biblia_navigate', handleNavigateEvent)
    }
  }, [])

  // Handle Escape key to return to home view from reading/harpa/bookmarks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawerOpen || isHarpaDrawerOpen) return
        if (activeTab !== 'home') {
          setActiveTab('home')
          refreshLastReading()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, isDrawerOpen, isHarpaDrawerOpen, refreshLastReading])

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
    setHighlightVerse(undefined)
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
    const textToCopy = `"${verse.text}" (${getBookName(verse.bookId, verse.bookName)} ${verse.chapter}:${verse.verse} - ${translationShort})`
    try {
      navigator.clipboard?.writeText(textToCopy)?.catch(() => {})
    } catch {}
  }

  const handleNavigateToHymn = (hymnNumber: number) => {
    if (!harpaData.getHymn(hymnNumber)) return
    setCurrentHymn(hymnNumber)
    setActiveTab('harpa')
    bibleStorage.setLastHymn(hymnNumber)
  }

  const handleToggleHymnFavorite = (hymn: HarpaHymn) => {
    if (hymnFavorites.has(hymn.number)) {
      bibleStorage.removeHymnFavorite(hymn.number)
      setHymnFavorites((prev) => {
        const next = new Set(prev)
        next.delete(hymn.number)
        return next
      })
    } else {
      bibleStorage.addHymnFavorite(hymn.number)
      setHymnFavorites((prev) => new Set(prev).add(hymn.number))
    }
  }

  const handleRemoveHymnFavorite = (hymnNumber: number) => {
    bibleStorage.removeHymnFavorite(hymnNumber)
    setHymnFavorites((prev) => {
      const next = new Set(prev)
      next.delete(hymnNumber)
      return next
    })
  }

  const handleCopyHymn = (hymn: HarpaHymn) => {
    const lines: string[] = [`${t('harpa.hymn_label')} ${hymn.number} - ${hymn.title}`]
    hymn.stanzas.forEach((stanza, index) => {
      lines.push('', `${index + 1}. ${stanza.join('\n')}`)
    })
    if (hymn.chorus) {
      lines.push('', `${t('harpa.chorus')}: ${hymn.chorus.join('\n')}`)
    }
    try {
      navigator.clipboard?.writeText(lines.join('\n'))?.catch(() => {})
    } catch {}
  }

  const currentBook = bibleData.getBookById(currentBookId) || bibleData.getBookById(43)!
  const currentVerses = bibleData.getChapterVerses(currentBookId, currentChapter)

  const prevStep = bibleData.getPrevChapter(currentBookId, currentChapter)
  const nextStep = bibleData.getNextChapter(currentBookId, currentChapter)

  return (
    <div className="relative h-full max-h-screen overflow-hidden bg-bg text-text flex flex-col font-sans">
      {/* Crisp photograph: the image is never blurred (blur read as a foggy,
          washed-out screen). Dimming comes from a scrim painted with the theme
          background token, so the text keeps the contrast the theme designed
          and the photograph stays sharp and colorful. */}
      <div
        aria-hidden="true"
        data-page-backdrop=""
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${pageBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'saturate(0.9)'
        }}
      />
      <div
        aria-hidden="true"
        data-page-scrim=""
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: 'rgb(var(--bg-main) / 0.5)' }}
      />

      {/* 1. Tela Inicial (Sem Navbar superior, 100% fiel ao print) */}
      {activeTab === 'home' && (
        <div data-page-layer="" className="relative flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
          <HomeView
            onNavigateToPassage={handleNavigateToPassage}
            onOpenBookmarks={() => setActiveTab('bookmarks')}
            onOpenHarpa={() => handleNavigateToHymn(1)}
            onNavigateToHymn={handleNavigateToHymn}
            lastReading={lastReading}
          />
        </div>
      )}

      {/* 2. Tela de Leitura: Bíblia Realista Aberta com Zíper e 2 Colunas (Conforme Foto 2) */}
      {activeTab === 'reading' && (
        <div data-page-layer="" className="relative flex-1 min-h-0 flex flex-col">
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

      {/* 2b. Harpa Cristã: mesmo livro realista, mesmas cores e paginação da Bíblia */}
      {activeTab === 'harpa' && (
        <div data-page-layer="" className="relative flex-1 min-h-0 flex flex-col">
          <HarpaBook
            hymnNumber={currentHymn}
            favoriteNumbers={hymnFavorites}
            onNavigateHymn={handleNavigateToHymn}
            onToggleFavorite={handleToggleHymnFavorite}
            onCopyHymn={handleCopyHymn}
            onOpenDrawer={() => setIsHarpaDrawerOpen(true)}
            onBackToHome={() => setActiveTab('home')}
          />
        </div>
      )}

      {/* 3. Tela de Marcadores e Favoritos */}
      {activeTab === 'bookmarks' && (
        <div data-page-layer="" className="relative flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(100, 100, 100, 0.5);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
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
                <span>{t('header.home')}</span>
              </button>
            </div>

            <BookmarksView
              onNavigateToPassage={handleNavigateToPassage}
              onStartReading={() => handleNavigateToPassage(currentBookId, currentChapter, highlightVerse)}
              favoriteHymns={Array.from(hymnFavorites)}
              onNavigateToHymn={handleNavigateToHymn}
              onRemoveHymnFavorite={handleRemoveHymnFavorite}
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

      {/* Índice da Harpa Cristã (1 a 640) com busca e favoritos */}
      <HarpaDrawer
        isOpen={isHarpaDrawerOpen}
        onClose={() => setIsHarpaDrawerOpen(false)}
        currentHymn={currentHymn}
        favoriteNumbers={hymnFavorites}
        onSelectHymn={handleNavigateToHymn}
      />
    </div>
  )
}

export default BiblePage
