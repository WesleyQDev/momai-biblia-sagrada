import React from 'react'
import { useBibleI18n } from '../services/i18n'

interface HeaderProps {
  activeTab: 'home' | 'reading' | 'bookmarks'
  onSelectTab: (tab: 'home' | 'reading' | 'bookmarks') => void
  onOpenDrawer?: () => void
  isReadingActive?: boolean
  currentReference?: string
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenDrawer,
  isReadingActive,
  currentReference
}) => {
  const { t } = useBibleI18n()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => onSelectTab('home')}>
        <div className="w-10 h-10 rounded-xl bg-accent/20 border border-border flex items-center justify-center text-text shadow-glass-sm">
          <svg
            className="w-5 h-5 text-text"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            <line x1="7" y1="8" x2="7" y2="13" />
            <line x1="5.5" y1="9.5" x2="8.5" y2="9.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text leading-tight">{t('header.title')}</h1>
          <p className="text-xs text-text-muted">{t('header.subtitle')}</p>
        </div>
      </div>

      <nav className="flex items-center space-x-1 bg-input/40 p-1 rounded-xl border border-border">
        <button
          onClick={() => onSelectTab('home')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'home'
              ? 'bg-card text-text shadow-sm border border-border'
              : 'text-text-muted hover:text-text hover:bg-card/50'
          }`}
        >
          {t('header.home')}
        </button>
        <button
          onClick={() => onSelectTab('reading')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTab === 'reading'
              ? 'bg-card text-text shadow-sm border border-border'
              : 'text-text-muted hover:text-text hover:bg-card/50'
          }`}
        >
          <span>{t('header.reading')}</span>
          {currentReference && activeTab === 'reading' && (
            <span className="text-[10px] opacity-75 font-normal px-1.5 py-0.5 rounded bg-input text-text-muted">
              {currentReference}
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectTab('bookmarks')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'bookmarks'
              ? 'bg-card text-text shadow-sm border border-border'
              : 'text-text-muted hover:text-text hover:bg-card/50'
          }`}
        >
          {t('header.bookmarks')}
        </button>
      </nav>

      <div className="flex items-center space-x-2">
        {activeTab === 'reading' && onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            title={t('header.index_title')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-input/60 hover:bg-input text-text text-xs font-medium border border-border transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>{t('header.index')}</span>
          </button>
        )}
      </div>
    </header>
  )
}
