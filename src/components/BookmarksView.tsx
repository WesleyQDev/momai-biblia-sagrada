import React, { useState, useEffect } from 'react'
import { bibleStorage } from '../services/storage'
import { harpaData } from '../services/harpa-data'
import { useBibleI18n } from '../services/i18n'
import { useHarpaLanguage } from '../services/useHarpaLanguage'
import ContextMenu from './ContextMenu'
import type { BibleBookmark } from '../types/bookmarks'
import type { Testament } from '../types/bible'
import type { HarpaHymn } from '../types/harpa'

interface BookmarksViewProps {
  onNavigateToPassage: (bookId: number, chapter: number, verse: number) => void
  onStartReading: () => void
  favoriteHymns: number[]
  onNavigateToHymn: (hymnNumber: number) => void
  onRemoveHymnFavorite: (hymnNumber: number) => void
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  onNavigateToPassage,
  onStartReading,
  favoriteHymns,
  onNavigateToHymn,
  onRemoveHymnFavorite
}) => {
  const { locale, t, getBookName } = useBibleI18n()
  useHarpaLanguage()
  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>([])
  const [filter, setFilter] = useState<Testament | 'ALL' | 'HARPA'>('ALL')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bookmark: BibleBookmark } | null>(null)

  useEffect(() => {
    setBookmarks(bibleStorage.getBookmarks())
  }, [])

  const handleCopy = (b: BibleBookmark) => {
    const text = `"${b.text}" (${getBookName(b.bookId, b.bookName)} ${b.chapter}:${b.verse})`
    try {
      void navigator.clipboard?.writeText?.(text)
    } catch {}
    setContextMenu(null)
  }

  const handleOpen = (b: BibleBookmark) => {
    onNavigateToPassage(b.bookId, b.chapter, b.verse)
    setContextMenu(null)
  }

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    bibleStorage.removeBookmark(id)
    setBookmarks(bibleStorage.getBookmarks())
    setContextMenu(null)
  }

  const filtered = bookmarks.filter((b) => {
    if (filter === 'HARPA') return false
    if (filter !== 'ALL' && b.testament !== filter) return false
    return true
  })

  const showVerseList = filter !== 'HARPA'
  const showHymns = filter === 'ALL' || filter === 'HARPA'

  const favoriteHymnList = [...favoriteHymns]
    .sort((a, b) => a - b)
    .map((number) => harpaData.getHymn(number))
    .filter((hymn): hymn is HarpaHymn => Boolean(hymn))

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16 text-text">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-bold text-text">{t('bookmarks.title')}</h2>
            <span aria-hidden="true" className="text-2xl leading-none select-none">
              ⭐
            </span>
          </div>
          <p className="text-xs text-text-muted">
            {bookmarks.length === 1
              ? t('bookmarks.subtitle_one')
              : t('bookmarks.subtitle_other', { count: bookmarks.length })}
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Testament and Harpa Filters */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-input/40 border border-border text-xs">
            {(
              [
                { id: 'ALL', label: t('bookmarks.filter_all') },
                { id: 'AT', label: t('bookmarks.filter_ot') },
                { id: 'NT', label: t('bookmarks.filter_nt') },
                { id: 'HARPA', label: t('bookmarks.filter_harpa') }
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  filter === option.id
                    ? 'bg-card text-text shadow-sm border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookmarks List */}
      {showVerseList &&
        (filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-input/50 flex items-center justify-center text-text-muted">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-text">{t('bookmarks.empty_title')}</h3>
            <p className="text-xs text-text-muted max-w-sm">
              {filter !== 'ALL'
                ? t('bookmarks.empty_filtered')
                : t('bookmarks.empty_desc')}
            </p>
            <button
              onClick={onStartReading}
              className="mt-2 px-4 py-2 rounded-xl bg-input hover:bg-input/80 border border-border text-xs font-semibold text-text transition-colors"
            >
              {t('bookmarks.go_reading')}
            </button>
          </div>
        ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              onClick={() => onNavigateToPassage(b.bookId, b.chapter, b.verse)}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setContextMenu({ x: e.clientX, y: e.clientY, bookmark: b })
              }}
              className="group p-5 rounded-2xl border border-border bg-card hover:border-accent/40 shadow-glass-sm transition-all duration-300 cursor-pointer flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text">
                    {getBookName(b.bookId, b.bookName)} {b.chapter}:{b.verse}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-input/60 text-text-muted border border-border">
                    {b.testament === 'AT' ? t('bookmarks.filter_ot') : t('bookmarks.filter_nt')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted">
                    {new Date(b.createdAt).toLocaleDateString(locale)}
                  </span>
                  <button
                    onClick={(e) => handleRemove(b.id, e)}
                    title={t('bookmarks.remove')}
                    className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-input transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <blockquote className="text-sm font-serif italic text-text leading-relaxed transition-colors">
                "{b.text}"
              </blockquote>

              <div className="flex items-center text-xs font-semibold text-text-muted group-hover:text-accent transition-colors pt-1">
                <span>{t('bookmarks.open_context')}</span>
                <svg className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
        ))}

      {/* Harpa Cristã favorite hymns */}
      {showHymns && (
        <section className="space-y-3 pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-serif font-bold text-text">{t('bookmarks.hymns_title')}</h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-input/60 text-text-muted border border-border">
            {favoriteHymnList.length}
          </span>
        </div>

        {favoriteHymnList.length === 0 ? (
          <p className="text-xs text-text-muted">{t('bookmarks.hymns_empty')}</p>
        ) : (
          <div className="space-y-2">
            {favoriteHymnList.map((hymn) => (
              <div
                key={hymn.number}
                onClick={() => onNavigateToHymn(hymn.number)}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card hover:border-accent/40 shadow-glass-sm transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-text shrink-0">
                    {t('harpa.hymn_label')} {hymn.number}
                  </span>
                  <span className="text-sm text-text-muted truncate">{hymn.title}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveHymnFavorite(hymn.number)
                  }}
                  title={t('bookmarks.remove_hymn')}
                  className="p-1 shrink-0 rounded-lg text-text-muted hover:text-text hover:bg-input transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        </section>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              id: 'open',
              label: t('bookmarks.open_context'),
              onClick: () => handleOpen(contextMenu.bookmark)
            },
            {
              id: 'copy',
              label: t('bookmarks.copy_verse'),
              shortcut: 'Ctrl+C',
              onClick: () => handleCopy(contextMenu.bookmark)
            },
            {
              id: 'remove',
              label: t('bookmarks.remove'),
              danger: true,
              onClick: () => handleRemove(contextMenu.bookmark.id)
            }
          ]}
        />
      )}
    </div>
  )
}
