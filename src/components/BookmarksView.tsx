import React, { useState, useEffect } from 'react'
import { bibleStorage } from '../services/storage'
import type { BibleBookmark } from '../types/bookmarks'
import type { Testament } from '../types/bible'

interface BookmarksViewProps {
  onNavigateToPassage: (bookId: number, chapter: number, verse: number) => void
  onStartReading: () => void
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  onNavigateToPassage,
  onStartReading
}) => {
  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>([])
  const [filterTestament, setFilterTestament] = useState<Testament | 'ALL'>('ALL')

  useEffect(() => {
    setBookmarks(bibleStorage.getBookmarks())
  }, [])

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    bibleStorage.removeBookmark(id)
    setBookmarks(bibleStorage.getBookmarks())
  }

  const filtered = bookmarks.filter((b) => {
    if (filterTestament !== 'ALL' && b.testament !== filterTestament) return false
    return true
  })

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-2xl font-serif font-bold text-text">Marcadores e Favoritos</h2>
          <p className="text-xs text-text-muted">
            {bookmarks.length} versículo{bookmarks.length === 1 ? '' : 's'} guardado{bookmarks.length === 1 ? '' : 's'} para estudo
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Testament Filters */}
          <div className="flex items-center p-1 rounded-xl bg-input/40 border border-border text-xs">
            <button
              onClick={() => setFilterTestament('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterTestament === 'ALL'
                  ? 'bg-card text-text shadow-sm border border-border'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTestament('AT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterTestament === 'AT'
                  ? 'bg-card text-text shadow-sm border border-border'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Antigo
            </button>
            <button
              onClick={() => setFilterTestament('NT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterTestament === 'NT'
                  ? 'bg-card text-text shadow-sm border border-border'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Novo
            </button>
          </div>
        </div>
      </div>

      {/* Bookmarks List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-input/50 flex items-center justify-center text-text-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-text">Nenhum marcador encontrado</h3>
          <p className="text-xs text-text-muted max-w-sm">
            {filterTestament !== 'ALL'
              ? 'Nenhum marcador neste testamento.'
              : 'Na tela de leitura, clique em qualquer versículo e selecione "Marcar" para adicioná-lo aqui.'}
          </p>
          <button
            onClick={onStartReading}
            className="mt-2 px-4 py-2 rounded-xl bg-input hover:bg-input/80 border border-border text-xs font-semibold text-text transition-colors"
          >
            Ir para a leitura da Bíblia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => onNavigateToPassage(b.bookId, b.chapter, b.verse)}
              className="group p-5 rounded-2xl border border-border bg-card hover:border-accent/40 shadow-glass-sm transition-all duration-300 cursor-pointer flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-text">
                    {b.bookName} {b.chapter}:{b.verse}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-input/60 text-text-muted border border-border">
                    {b.testament === 'AT' ? 'Antigo' : 'Novo'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-text-muted">
                    {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <button
                    onClick={(e) => handleRemove(b.id, e)}
                    title="Remover marcador"
                    className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-input transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <blockquote className="text-sm font-serif italic text-text-muted group-hover:text-text leading-relaxed transition-colors">
                "{b.text}"
              </blockquote>

              <div className="flex items-center text-xs font-semibold text-text group-hover:text-accent transition-colors pt-1">
                <span>Abrir e ler no contexto</span>
                <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
