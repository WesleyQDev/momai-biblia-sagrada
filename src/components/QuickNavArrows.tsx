import React from 'react'

interface QuickNavArrowsProps {
  currentBook: string
  currentChapter: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  onOpenDrawer?: () => void
}

export const QuickNavArrows: React.FC<QuickNavArrowsProps> = ({
  currentBook,
  currentChapter,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onOpenDrawer
}) => {
  return (
    <nav aria-label="Navegação entre capítulos" className="sticky bottom-0 z-20 w-full bg-card/90 backdrop-blur-md border-t border-border px-4 py-3 flex items-center justify-between shadow-glass-md">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
          hasPrev
            ? 'bg-input/60 hover:bg-input text-text border border-border cursor-pointer active:scale-95'
            : 'opacity-30 text-text-muted cursor-not-allowed border border-transparent'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Capítulo Anterior</span>
        <span className="sm:hidden">Anterior</span>
      </button>

      <div
        onClick={onOpenDrawer}
        title="Clique para abrir índice de livros e capítulos"
        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-input/40 hover:bg-input/70 border border-border cursor-pointer transition-colors"
      >
        <span className="text-xs font-bold text-text">
          {currentBook} {currentChapter}
        </span>
        <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
          hasNext
            ? 'bg-input/60 hover:bg-input text-text border border-border cursor-pointer active:scale-95'
            : 'opacity-30 text-text-muted cursor-not-allowed border border-transparent'
        }`}
      >
        <span className="hidden sm:inline">Próximo Capítulo</span>
        <span className="sm:hidden">Próximo</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  )
}
