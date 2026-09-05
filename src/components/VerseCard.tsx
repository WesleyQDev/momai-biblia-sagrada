import React from 'react'
import { useBibleI18n } from '../services/i18n'
import type { BibleVerse } from '../types/bible'

interface VerseCardProps {
  verse: BibleVerse
  onRefresh: (e: React.MouseEvent) => void
  onNavigate: (verse: BibleVerse) => void
}

export const VerseCard: React.FC<VerseCardProps> = ({ verse, onRefresh, onNavigate }) => {
  const { t, getBookName } = useBibleI18n()

  return (
    <div
      onClick={() => onNavigate(verse)}
      className="group relative cursor-pointer px-4 py-3 transition-opacity hover:opacity-90 select-text"
    >
      <div className="flex flex-col space-y-2">
        {/* Quoted verse text without borders or backgrounds */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-base sm:text-lg font-serif italic text-text leading-relaxed text-center sm:text-left flex-1">
            "{verse.text}"
          </p>

          <button
            onClick={onRefresh}
            title={t('card.reroll')}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-input/40 transition-all shrink-0"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Reference aligned right: {Livro}, {Capítulo} : {Versículo} */}
        <div className="text-right">
          <span className="text-xs sm:text-sm font-semibold text-text-muted tracking-wide">
            {getBookName(verse.bookId, verse.bookName)}, {verse.chapter} : {verse.verse}
          </span>
        </div>
      </div>
    </div>
  )
}
