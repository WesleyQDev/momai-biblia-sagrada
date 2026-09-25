import React, { useState, useEffect, useRef, Fragment } from 'react'
import { VerseCard } from './VerseCard'
import { WheatIcon } from './icons/WheatIcon'
import { TenCommandmentsIcon } from './icons/TenCommandmentsIcon'
import { StarBookmarkIcon } from './icons/StarBookmarkIcon'
import { BookRibbonIcon } from './icons/BookRibbonIcon'
import { SearchGlassIcon } from './icons/SearchGlassIcon'
import { HarpIcon } from './icons/HarpIcon'
import { bibleSearch } from '../services/search'
import { randomVerseService } from '../services/random-verse'
import { harpaData } from '../services/harpa-data'
import { useBibleI18n } from '../services/i18n'
import { useBibleLanguage } from '../services/useBibleLanguage'
import type { BibleVerse, SearchResult, SearchScope } from '../types/bible'
import type { ReadingProgress } from '../types/reading'

interface HomeViewProps {
  onNavigateToPassage: (bookId: number, chapter: number, verse?: number) => void
  onOpenBookmarks: () => void
  onOpenHarpa: () => void
  onNavigateToHymn?: (hymnNumber: number) => void
  lastReading: ReadingProgress
}

// Height-aware sizing keeps the whole home screen inside the window without
// scrolling: type and icons grow with the viewport height and clamp so very
// short or very tall windows stay readable.
const TITLE_SIZE = 'clamp(1.25rem, 3vh + 0.7rem, 2.6rem)'
const LABEL_SIZE = 'clamp(0.8rem, 1.4vh + 0.5rem, 1.35rem)'
const HINT_SIZE = 'clamp(0.65rem, 0.9vh + 0.4rem, 0.92rem)'
const ICON_BOX_SIZE = 'clamp(2.5rem, 8vh, 5.25rem)'
const BUTTON_PADDING = 'clamp(0.25rem, 1vh + 0.15rem, 1.05rem)'
const ROOT_GAP = 'clamp(0.5rem, 2vh, 1rem)'
const ROOT_PADDING_Y = 'clamp(0.5rem, 2vh, 1rem)'
const HEADER_PADDING_TOP = 'clamp(0.25rem, 1vh, 0.5rem)'
const ICON_LABEL_GAP = 'clamp(0.25rem, 1vh, 0.5rem)'
const GRID_GAP_Y = 'clamp(0.25rem, 1vh, 0.5rem)'
const GRID_PADDING_Y = 'clamp(0.25rem, 1vh, 0.5rem)'

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToPassage,
  onOpenBookmarks,
  onOpenHarpa,
  onNavigateToHymn,
  lastReading
}) => {
  const { t, getBookName } = useBibleI18n()
  const { languageId } = useBibleLanguage()
  const [randomVerse, setRandomVerse] = useState<BibleVerse>(() => randomVerseService.getRandomVerse())
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchScope, setSearchScope] = useState<SearchScope>('ALL')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchModalRef = useRef<HTMLDivElement>(null)

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 80)
    } else {
      setSearchQuery('')
      setSearchResults([])
      setSearchScope('ALL')
    }
  }, [isSearchOpen])

  // Debounced search
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults([])
      return
    }

    const timeout = setTimeout(() => {
      const results = bibleSearch.search(q, { scope: searchScope, limit: 16 })
      setSearchResults(results)
    }, 180)

    return () => clearTimeout(timeout)
  }, [searchQuery, searchScope, languageId])

  // Refresh the devotional verse whenever the Bible language changes
  useEffect(() => {
    setRandomVerse(randomVerseService.getRandomVerse())
  }, [languageId])

  // Close search modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen])

  const handleRefreshVerse = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRandomVerse(randomVerseService.getRandomVerse())
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    if (result.type === 'hymn' && result.hymn) {
      if (onNavigateToHymn) {
        onNavigateToHymn(result.hymn.number)
      } else {
        onOpenHarpa()
      }
    } else if (result.verse) {
      onNavigateToPassage(result.verse.bookId, result.verse.chapter, result.verse.verse)
    }
    setIsSearchOpen(false)
  }

  return (
    <div
      className="relative w-full max-w-2xl mx-auto px-5 flex flex-1 min-h-0 flex-col justify-between animate-fade-in overflow-hidden select-none text-text"
      style={{ gap: ROOT_GAP, paddingTop: ROOT_PADDING_Y, paddingBottom: ROOT_PADDING_Y }}
    >
      {/* Botão de Busca da Lupa no Canto Superior Direito */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setIsSearchOpen(true)}
          title={t('home.search_title')}
          className="p-2.5 rounded-2xl bg-input/60 hover:bg-input border border-border text-text hover:text-accent transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
        >
          <SearchGlassIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Modal / Popup de Busca Rápida ao clicar na Lupa */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            ref={searchModalRef}
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-in-up"
          >
            <div className="p-3 border-b border-border flex items-center space-x-2">
              <SearchGlassIcon className="w-4 h-4 text-text-muted shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSearchOpen(false)
                  }
                }}
                placeholder={t('home.search_placeholder')}
                className="flex-1 bg-transparent text-text text-sm placeholder:text-text-muted/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-text-muted hover:text-text rounded-lg cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filtros de Escopo */}
            <div className="flex items-center px-3 py-1.5 gap-1.5 border-b border-border/50 bg-input/20 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setSearchScope('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  searchScope === 'ALL'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/30'
                    : 'text-text-muted hover:text-text hover:bg-input/60'
                }`}
              >
                {t('home.search_filter_all')}
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('AT')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  searchScope === 'AT'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/30'
                    : 'text-text-muted hover:text-text hover:bg-input/60'
                }`}
              >
                {t('home.search_filter_at')}
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('NT')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  searchScope === 'NT'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/30'
                    : 'text-text-muted hover:text-text hover:bg-input/60'
                }`}
              >
                {t('home.search_filter_nt')}
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('HARPA')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                  searchScope === 'HARPA'
                    ? 'bg-accent/20 text-accent font-semibold border border-accent/30'
                    : 'text-text-muted hover:text-text hover:bg-input/60'
                }`}
              >
                <HarpIcon className="w-3 h-3 shrink-0" />
                <span>{t('home.search_filter_harpa')}</span>
              </button>
            </div>

            {/* Resultados */}
            {searchResults.length > 0 && (
              <div className="max-h-72 sm:max-h-80 overflow-y-auto divide-y divide-border/50">
                {searchResults.map((res, index) => {
                  const hymn = res.type === 'hymn' ? res.hymn : undefined
                  const verse = res.type === 'verse' ? res.verse : undefined
                  const key = hymn ? `hymn-${hymn.number}` : `verse-${verse?.id || res.score}`

                  const hasBothTypes =
                    searchScope === 'ALL' &&
                    searchResults.some((r) => r.type === 'verse') &&
                    searchResults.some((r) => r.type === 'hymn')
                  const isFirstVerse =
                    res.type === 'verse' && (index === 0 || searchResults[index - 1].type !== 'verse')
                  const isFirstHymn =
                    res.type === 'hymn' && (index === 0 || searchResults[index - 1].type !== 'hymn')

                  return (
                    <Fragment key={key}>
                      {hasBothTypes && isFirstVerse && (
                        <div className="sticky top-0 z-10 px-3.5 py-1.5 bg-card/95 backdrop-blur-sm border-b border-border/40 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                          <span>{t('home.search_section_verses')}</span>
                          <span className="text-[10px] font-mono font-normal">
                            {searchResults.filter((r) => r.type === 'verse').length}
                          </span>
                        </div>
                      )}
                      {hasBothTypes && isFirstHymn && (
                        <div className="sticky top-0 z-10 px-3.5 py-1.5 bg-card/95 backdrop-blur-sm border-b border-border/40 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <HarpIcon className="w-3 h-3 text-accent" />
                            <span>{t('home.search_section_harpa')}</span>
                          </span>
                          <span className="text-[10px] font-mono font-normal">
                            {searchResults.filter((r) => r.type === 'hymn').length}
                          </span>
                        </div>
                      )}
                      <div
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-3.5 hover:bg-input/50 cursor-pointer transition-colors flex flex-col space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text flex items-center gap-1.5">
                            {hymn ? (
                              <>
                                <HarpIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                                <span>{t('harpa.hymn_label')} {hymn.number} • {hymn.title}</span>
                              </>
                            ) : (
                              verse && `${getBookName(verse.bookId, verse.bookName)} ${verse.chapter}:${verse.verse}`
                            )}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-input text-text-muted border border-border">
                            {hymn
                              ? t('home.search_harpa_badge')
                              : res.matchType === 'exact_reference'
                                ? t('home.search_reference')
                                : t('home.search_excerpt')}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted italic font-serif line-clamp-2">
                          {hymn ? res.snippet : `"${verse?.text || ''}"`}
                        </p>
                      </div>
                    </Fragment>
                  )
                })}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="p-6 text-center text-xs text-text-muted italic">
                {searchScope === 'HARPA'
                  ? t('harpa.search_no_results', { query: searchQuery })
                  : t('home.search_no_results', { query: searchQuery })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Header: Título Centralizado */}
      <div className="flex items-center justify-center min-h-0 shrink-0 text-center" style={{ paddingTop: HEADER_PADDING_TOP }}>
        <h1
          className="font-serif font-bold text-text tracking-wide select-none"
          style={{ fontSize: TITLE_SIZE }}
        >
          {t('home.title')}
        </h1>
      </div>

      {/* 2. Card do Versículo Aleatório (Limpo, sem fundos) */}
      <section className="w-full min-h-0 shrink-0">
        <VerseCard
          verse={randomVerse}
          onRefresh={handleRefreshVerse}
          onNavigate={(v) => onNavigateToPassage(v.bookId, v.chapter, v.verse)}
        />
      </section>

      {/* 3. Os 4 Cards Transparentes Sem Fundo e Sem Bordas, com a Harpa Cristã ao Centro */}
      <section
        className="w-fit mx-auto grid grid-cols-3 gap-x-3 sm:gap-x-5 min-h-0 items-center justify-items-center"
        style={{ rowGap: GRID_GAP_Y, paddingTop: GRID_PADDING_Y, paddingBottom: GRID_PADDING_Y }}
      >
        {/* Card 1: Novo testamento */}
        <button
          onClick={() => onNavigateToPassage(40, 1)}
          style={{ gridColumnStart: 1, gridRowStart: 1, padding: BUTTON_PADDING }}
          className="group flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div
            className="transition-transform duration-200 group-hover:-translate-y-1"
            style={{ width: ICON_BOX_SIZE, height: ICON_BOX_SIZE, marginBottom: ICON_LABEL_GAP }}
          >
            <WheatIcon className="w-full h-full drop-shadow-sm" />
          </div>
          <span
            className="font-bold text-text tracking-tight group-hover:text-accent transition-colors"
            style={{ fontSize: LABEL_SIZE }}
          >
            {t('home.new_testament')}
          </span>
        </button>

        {/* Card 2: Velho Testamento */}
        <button
          onClick={() => onNavigateToPassage(1, 1)}
          style={{ gridColumnStart: 3, gridRowStart: 1, padding: BUTTON_PADDING }}
          className="group flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div
            className="transition-transform duration-200 group-hover:-translate-y-1"
            style={{ width: ICON_BOX_SIZE, height: ICON_BOX_SIZE, marginBottom: ICON_LABEL_GAP }}
          >
            <TenCommandmentsIcon className="w-full h-full drop-shadow-sm" />
          </div>
          <span
            className="font-bold text-text tracking-tight group-hover:text-accent transition-colors"
            style={{ fontSize: LABEL_SIZE }}
          >
            {t('home.old_testament')}
          </span>
        </button>

        {/* Centro: Harpa Cristã — 640 hinos com o mesmo leitor da Bíblia */}
        <button
          onClick={onOpenHarpa}
          title={t('harpa.total', { count: harpaData.getTotalHymns() })}
          style={{ gridColumnStart: 2, gridRowStart: 2, padding: BUTTON_PADDING }}
          className="group flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div
            className="transition-transform duration-200 group-hover:-translate-y-1"
            style={{ width: ICON_BOX_SIZE, height: ICON_BOX_SIZE, marginBottom: ICON_LABEL_GAP }}
          >
            <HarpIcon className="w-full h-full drop-shadow-sm" />
          </div>
          <span
            className="font-bold text-text tracking-tight group-hover:text-accent transition-colors"
            style={{ fontSize: LABEL_SIZE }}
          >
            {t('home.harpa')}
          </span>
          <span className="text-text-muted font-medium" style={{ fontSize: HINT_SIZE }}>
            {t('home.harpa_hint')}
          </span>
        </button>

        {/* Card 3: Marcadores */}
        <button
          onClick={onOpenBookmarks}
          style={{ gridColumnStart: 1, gridRowStart: 3, padding: BUTTON_PADDING }}
          className="group flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div
            className="transition-transform duration-200 group-hover:-translate-y-1"
            style={{ width: ICON_BOX_SIZE, height: ICON_BOX_SIZE, marginBottom: ICON_LABEL_GAP }}
          >
            <StarBookmarkIcon className="w-full h-full drop-shadow-sm" />
          </div>
          <span
            className="font-bold text-text tracking-tight group-hover:text-accent transition-colors"
            style={{ fontSize: LABEL_SIZE }}
          >
            {t('home.bookmarks')}
          </span>
        </button>

        {/* Card 4: Continuar leitura */}
        <button
          onClick={() => onNavigateToPassage(lastReading.bookId, lastReading.chapter, undefined)}
          style={{ gridColumnStart: 3, gridRowStart: 3, padding: BUTTON_PADDING }}
          className="group flex flex-col items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div
            className="transition-transform duration-200 group-hover:-translate-y-1"
            style={{ width: ICON_BOX_SIZE, height: ICON_BOX_SIZE, marginBottom: ICON_LABEL_GAP }}
          >
            <BookRibbonIcon className="w-full h-full drop-shadow-sm" />
          </div>
          <span
            className="font-bold text-text tracking-tight group-hover:text-accent transition-colors"
            style={{ fontSize: LABEL_SIZE }}
          >
            {t('home.continue_reading')}
          </span>
        </button>
      </section>
    </div>
  )
}
