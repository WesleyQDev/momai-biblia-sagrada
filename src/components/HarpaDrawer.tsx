import React, { useMemo, useState } from 'react'
import { harpaData } from '../services/harpa-data'
import { useBibleI18n } from '../services/i18n'
import { useHarpaLanguage } from '../services/useHarpaLanguage'
import { SearchGlassIcon } from './icons/SearchGlassIcon'
import type { HarpaHymn } from '../types/harpa'

interface HarpaDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentHymn: number
  favoriteNumbers: Set<number>
  onSelectHymn: (hymnNumber: number) => void
}

type HarpaFilter = 'all' | 'favorites'

export const HarpaDrawer: React.FC<HarpaDrawerProps> = ({
  isOpen,
  onClose,
  currentHymn,
  favoriteNumbers,
  onSelectHymn
}) => {
  const { t } = useBibleI18n()
  const { datasetVersion } = useHarpaLanguage()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<HarpaFilter>('all')

  const hymns: HarpaHymn[] = useMemo(() => {
    const term = query.trim()
    if (term) {
      const results = harpaData.search(term, { limit: harpaData.getTotalHymns() })
      return results.map((result) => result.hymn)
    }
    if (filter === 'favorites') {
      return harpaData.getAllHymns().filter((hymn) => favoriteNumbers.has(hymn.number))
    }
    return harpaData.getAllHymns()
  }, [query, filter, favoriteNumbers, datasetVersion])

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose])

  if (!isOpen) return null

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

      <aside
        aria-label={t('harpa.index_title')}
        style={{ height: '100%' }}
        className="relative z-10 w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-up"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-card shrink-0">
          <div className="flex flex-col">
            <h2 className="text-base font-serif font-bold text-text">{t('harpa.index_title')}</h2>
            <span className="text-[11px] text-text-muted font-medium">{t('harpa.subtitle')}</span>
          </div>
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

        <div className="px-6 pt-3 pb-2 border-b border-border/50 space-y-3">
          <div className="flex items-center space-x-2 rounded-xl bg-input/40 border border-border/60 px-3 py-1.5">
            <SearchGlassIcon className="w-4 h-4 text-text-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('harpa.search_placeholder')}
              className="flex-1 bg-transparent text-text text-xs placeholder:text-text-muted/70 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-text-muted hover:text-text rounded-lg cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex rounded-xl bg-input/40 p-1 border border-border/60">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-card text-text shadow-sm border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t('harpa.filter_all')}
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === 'favorites'
                  ? 'bg-card text-text shadow-sm border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t('harpa.filter_favorites')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
          {hymns.map((hymn) => {
            const isCurrent = hymn.number === currentHymn
            return (
              <button
                key={hymn.number}
                onClick={() => {
                  onSelectHymn(hymn.number)
                  onClose()
                }}
                className={`w-full py-2 px-3 flex items-center gap-3 text-left transition-colors rounded-xl cursor-pointer ${
                  isCurrent ? 'bg-accent/15 text-text font-bold' : 'hover:bg-input/40 text-text'
                }`}
              >
                <span className="text-[11px] font-mono font-bold text-text-muted w-8 shrink-0 text-right">
                  {hymn.number}
                </span>
                <span className="text-sm font-serif flex-1 truncate">{hymn.title}</span>
                {favoriteNumbers.has(hymn.number) && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d97706] shrink-0" />
                )}
              </button>
            )
          })}

          {hymns.length === 0 && (
            <div className="p-6 text-center text-xs text-text-muted italic">
              {query.trim()
                ? t('harpa.search_no_results', { query: query.trim() })
                : t('harpa.empty_favorites')}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border/50 shrink-0">
          <p className="text-[10px] leading-relaxed text-text-muted">{t('harpa.original_note')}</p>
        </div>
      </aside>
    </div>
  )
}
