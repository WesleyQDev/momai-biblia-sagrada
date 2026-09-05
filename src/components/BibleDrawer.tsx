import React, { useState } from 'react'
import { bibleData } from '../services/bible-data'
import { useBibleI18n } from '../services/i18n'
import type { BibleBookInfo, Testament } from '../types/bible'

interface BibleDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentBookId: number
  currentChapter: number
  onSelectPassage: (bookId: number, chapter: number, verse?: number) => void
}

export const BibleDrawer: React.FC<BibleDrawerProps> = ({
  isOpen,
  onClose,
  currentBookId,
  currentChapter,
  onSelectPassage
}) => {
  const { t, getBookName } = useBibleI18n()
  const [activeTestament, setActiveTestament] = useState<Testament>(() => {
    const current = bibleData.getBookById(currentBookId)
    return current ? current.testament : 'NT'
  })
  const [selectedBook, setSelectedBook] = useState<BibleBookInfo | null>(null)

  if (!isOpen) return null

  const books =
    activeTestament === 'AT'
      ? bibleData.getOldTestamentBooks()
      : bibleData.getNewTestamentBooks()

  const handleSelectBook = (book: BibleBookInfo) => {
    setSelectedBook(book)
  }

  const handleSelectChapter = (ch: number) => {
    if (!selectedBook) return
    onSelectPassage(selectedBook.id, ch, 1)
    onClose()
  }

  return (
    <div
      style={{ top: '48px', height: 'calc(100vh - 48px)' }}
      className="fixed inset-x-0 bottom-0 z-[9999] flex justify-end pointer-events-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Container (Abaixo da titlebar nativa da MomAI) */}
      <aside
        aria-label="Índice dos Livros"
        style={{ height: '100%' }}
        className="relative z-10 w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-up"
      >
        {/* Header Superior Limpo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-card shrink-0">
          <h2 className="text-base font-serif font-bold text-[#1c1917]">
            {selectedBook ? getBookName(selectedBook.id, selectedBook.name) : t('drawer.title')}
          </h2>

          <div className="flex items-center space-x-2">
            {selectedBook && (
              <button
                onClick={() => setSelectedBook(null)}
                className="text-xs text-text-muted hover:text-text px-2 py-1 rounded-lg bg-input/60 transition-colors cursor-pointer"
              >
                {t('drawer.all_books')}
              </button>
            )}
            <button
              onClick={onClose}
              title={t('drawer.close')}
              className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-input transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Alternador de Testamento (Minimalista) */}
        {!selectedBook && (
          <div className="px-6 pt-3 pb-2 border-b border-border/50">
            <div className="flex rounded-xl bg-input/40 p-1 border border-border/60">
              <button
                onClick={() => setActiveTestament('AT')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTestament === 'AT'
                    ? 'bg-card text-text shadow-sm border border-border/60'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t('drawer.ot_count', { count: bibleData.getOldTestamentBooks().length })}
              </button>
              <button
                onClick={() => setActiveTestament('NT')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTestament === 'NT'
                    ? 'bg-card text-text shadow-sm border border-border/60'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t('drawer.nt_count', { count: bibleData.getNewTestamentBooks().length })}
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        {!selectedBook ? (
          /* Lista Vertical Minimalista de Livros */
          <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
            {books.map((b) => {
              const isCurrent = b.id === currentBookId
              return (
                <button
                  key={b.id}
                  onClick={() => handleSelectBook(b)}
                  className={`w-full py-2.5 px-4 flex items-center justify-between text-left transition-colors rounded-xl cursor-pointer ${
                    isCurrent
                      ? 'bg-accent/15 text-[#1c1917] font-bold'
                      : 'hover:bg-input/40 text-[#1c1917]'
                  }`}
                >
                  <span className="text-sm font-serif">{getBookName(b.id, b.name)}</span>
                  <span className="text-xs text-text-muted/60">›</span>
                </button>
              )
            })}
          </div>
        ) : (
          /* Matriz Estilo Calendário de Capítulos (Quadradinhos compactos lado a lado) */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <span className="text-xs text-text-muted mb-4 font-medium">{t('drawer.select_chapter')}</span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px'
              }}
              className="w-full"
            >
              {Array.from({ length: selectedBook.totalChapters }, (_, i) => i + 1).map((ch) => {
                const isCurrent = selectedBook.id === currentBookId && ch === currentChapter
                return (
                  <button
                    key={ch}
                    onClick={() => handleSelectChapter(ch)}
                    style={{ aspectRatio: '1 / 1' }}
                    className={`w-full rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center justify-center ${
                      isCurrent
                        ? 'bg-accent text-[#1c1917] border-accent shadow'
                        : 'bg-input/40 hover:bg-input border-border/80 text-[#1c1917]'
                    }`}
                  >
                    {ch}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
