import React, { useState, useEffect, useRef } from 'react'
import { VerseCard } from './VerseCard'
import { BibleExtensionIcon } from './icons/BibleExtensionIcon'
import { WheatIcon } from './icons/WheatIcon'
import { TenCommandmentsIcon } from './icons/TenCommandmentsIcon'
import { StarBookmarkIcon } from './icons/StarBookmarkIcon'
import { BookRibbonIcon } from './icons/BookRibbonIcon'
import { SearchGlassIcon } from './icons/SearchGlassIcon'
import { bibleSearch } from '../services/search'
import { randomVerseService } from '../services/random-verse'
import type { BibleVerse, SearchResult } from '../types/bible'
import type { ReadingProgress } from '../types/reading'

interface HomeViewProps {
  onNavigateToPassage: (bookId: number, chapter: number, verse?: number) => void
  onOpenBookmarks: () => void
  lastReading: ReadingProgress
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToPassage,
  onOpenBookmarks,
  lastReading
}) => {
  const [randomVerse, setRandomVerse] = useState<BibleVerse>(() => randomVerseService.getRandomVerse())
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
      const results = bibleSearch.search(q, { limit: 8 })
      setSearchResults(results)
    }, 180)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Close search modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchModalRef.current && !searchModalRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSearchOpen])

  const handleRefreshVerse = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRandomVerse(randomVerseService.getRandomVerse())
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    onNavigateToPassage(result.verse.bookId, result.verse.chapter, result.verse.verse)
    setIsSearchOpen(false)
  }

  return (
    <div className="relative max-w-2xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col justify-between min-h-[calc(100vh-20px)] animate-fade-in space-y-6 select-none">
      {/* Botão de Busca da Lupa no Canto Superior Direito */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setIsSearchOpen(true)}
          title="Buscar versículo"
          className="p-2.5 rounded-2xl bg-input/60 hover:bg-input border border-border text-text hover:text-accent transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
        >
          <SearchGlassIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Modal / Popup de Busca Rápida ao clicar na Lupa */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/50 backdrop-blur-sm animate-fade-in">
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
                placeholder="Ex: João 3:16, amor, luz..."
                className="flex-1 bg-transparent text-text text-sm placeholder:text-text-muted/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-text-muted hover:text-text rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-text-muted hover:text-text bg-input/40"
              >
                Esc
              </button>
            </div>

            {/* Resultados */}
            {searchResults.length > 0 && (
              <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {searchResults.map((res) => (
                  <div
                    key={res.verse.id}
                    onClick={() => handleSelectSearchResult(res)}
                    className="p-3.5 hover:bg-input/50 cursor-pointer transition-colors flex flex-col space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text">
                        {res.verse.bookName} {res.verse.chapter}:{res.verse.verse}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-input text-text-muted border border-border">
                        {res.matchType === 'exact_reference' ? 'Referência' : 'Trecho'}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted italic font-serif line-clamp-2">
                      "{res.verse.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="p-6 text-center text-xs text-text-muted italic">
                Nenhum versículo encontrado para "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Header: Ícone da Bíblia + Espaço Generoso + Título Centralizado */}
      <div className="flex items-center justify-center space-x-5 pt-4">
        <BibleExtensionIcon className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-md shrink-0 transition-transform hover:scale-105" />
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-text tracking-wide select-none">
          Bíblia Sagrada
        </h1>
      </div>

      {/* 2. Card do Versículo Aleatório (Limpo, sem fundos) */}
      <section className="w-full my-auto">
        <VerseCard
          verse={randomVerse}
          onRefresh={handleRefreshVerse}
          onNavigate={(v) => onNavigateToPassage(v.bookId, v.chapter, v.verse)}
        />
      </section>

      {/* 3. Os 4 Cards Transparentes Sem Fundo e Sem Bordas */}
      <section className="w-full grid grid-cols-2 gap-4 sm:gap-6 py-2">
        {/* Card 1: Novo testamento */}
        <button
          onClick={() => onNavigateToPassage(40, 1)}
          className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div className="mb-2 transition-transform duration-200 group-hover:-translate-y-1">
            <WheatIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm" />
          </div>
          <span className="text-sm sm:text-base font-bold text-text tracking-tight group-hover:text-accent transition-colors">
            Novo testamento
          </span>
        </button>

        {/* Card 2: Velho Testamento */}
        <button
          onClick={() => onNavigateToPassage(1, 1)}
          className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div className="mb-2 transition-transform duration-200 group-hover:-translate-y-1">
            <TenCommandmentsIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm" />
          </div>
          <span className="text-sm sm:text-base font-bold text-text tracking-tight group-hover:text-accent transition-colors">
            Velho Testamento
          </span>
        </button>

        {/* Card 3: Marcadores */}
        <button
          onClick={onOpenBookmarks}
          className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div className="mb-2 transition-transform duration-200 group-hover:-translate-y-1">
            <StarBookmarkIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm" />
          </div>
          <span className="text-sm sm:text-base font-bold text-text tracking-tight group-hover:text-accent transition-colors">
            Marcadores
          </span>
        </button>

        {/* Card 4: Continuar leitura */}
        <button
          onClick={() => onNavigateToPassage(lastReading.bookId, lastReading.chapter, lastReading.verse)}
          className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer bg-transparent border-0 shadow-none text-center"
        >
          <div className="mb-2 transition-transform duration-200 group-hover:-translate-y-1">
            <BookRibbonIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm" />
          </div>
          <span className="text-sm sm:text-base font-bold text-text tracking-tight group-hover:text-accent transition-colors">
            Continuar leitura
          </span>
        </button>
      </section>
    </div>
  )
}
