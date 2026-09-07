import React, { useEffect, useRef, useState } from 'react'
import { BIBLE_LANGUAGES } from '../services/bible-languages'
import { useBibleLanguage } from '../services/useBibleLanguage'
import { useBibleI18n } from '../services/i18n'

export const LanguageMenu: React.FC = () => {
  const { t } = useBibleI18n()
  const { languageId, changeLanguage } = useBibleLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (id: (typeof BIBLE_LANGUAGES)[number]['id']) => {
    void changeLanguage(id).then((ok) => {
      if (ok) setIsOpen(false)
    })
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={t('languages.title')}
        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-input/50 hover:bg-input border border-border text-xs font-semibold text-text transition-all cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9s-1.4 6.4-3.9 9c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3z"
          />
        </svg>
        <span>{t('languages.button')}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('languages.title')}
          className="absolute right-0 top-full mt-2 w-64 z-50 bg-card border border-border shadow-2xl rounded-2xl p-1.5 animate-fade-in"
        >
          <p className="px-3 pt-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {t('languages.title')}
          </p>
          {BIBLE_LANGUAGES.map((lang) => {
            const isCurrent = lang.id === languageId
            return (
              <button
                key={lang.id}
                role="menuitemradio"
                aria-checked={isCurrent}
                onClick={() => handleSelect(lang.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  isCurrent ? 'bg-accent/15' : 'hover:bg-input/50'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-text truncate">{lang.label}</span>
                  <span className="block text-[11px] text-text-muted truncate">
                    {lang.translationName}
                  </span>
                </span>
                {isCurrent && (
                  <svg className="w-4 h-4 shrink-0 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
