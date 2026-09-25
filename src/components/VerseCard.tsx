import React, { useRef } from 'react'
import { useBibleI18n } from '../services/i18n'
import type { BibleVerse } from '../types/bible'

interface VerseCardProps {
  verse: BibleVerse
  onRefresh: (e: React.MouseEvent) => void
  onNavigate: (verse: BibleVerse) => void
}

// Height-aware sizing keeps the devotional verse inside the home screen
// without scrolling, growing on tall windows and shrinking on short ones.
const VERSE_TEXT_SIZE = 'clamp(0.9rem, 1.8vh + 0.5rem, 1.5rem)'
const VERSE_REF_SIZE = 'clamp(0.7rem, 1vh + 0.45rem, 1.05rem)'
const VERSE_PADDING_Y = 'clamp(0.5rem, 2vh, 1rem)'
const VERSE_GAP = 'clamp(0.25rem, 1vh, 0.5rem)'

export const VerseCard: React.FC<VerseCardProps> = ({ verse, onRefresh, onNavigate }) => {
  const { t, getBookName } = useBibleI18n()
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 0) {
      return
    }

    if (dragStartPos.current) {
      const distance = Math.hypot(
        e.clientX - dragStartPos.current.x,
        e.clientY - dragStartPos.current.y
      )
      dragStartPos.current = null
      if (distance > 5) {
        return
      }
    }

    onNavigate(verse)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className="group relative cursor-pointer px-5 transition-opacity hover:opacity-90 select-text"
      style={{ paddingTop: VERSE_PADDING_Y, paddingBottom: VERSE_PADDING_Y }}
    >
      <div className="flex flex-col" style={{ gap: VERSE_GAP }}>
        {/* Quoted verse text without borders or backgrounds */}
        <div className="flex items-start justify-between gap-3">
          <p
            className="font-serif italic text-text leading-relaxed text-center sm:text-left flex-1"
            style={{ fontSize: VERSE_TEXT_SIZE }}
          >
            "{verse.text}"
          </p>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onRefresh(e)
            }}
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
          <span
            className="font-semibold text-text-muted tracking-wide"
            style={{ fontSize: VERSE_REF_SIZE }}
          >
            {getBookName(verse.bookId, verse.bookName)}, {verse.chapter} : {verse.verse}
          </span>
        </div>
      </div>
    </div>
  )
}
