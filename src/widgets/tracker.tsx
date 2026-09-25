import React, { useEffect, useState, useMemo, useCallback, useRef, type JSX } from 'react'
import { useBibleI18n } from '../services/i18n'
import { bibleStorage } from '../services/storage'
import { bibleData } from '../services/bible-data'
import type { BibleDailyTracker } from '../types/reading'
import type { BibleVerse } from '../types/bible'

const FlameIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
)

const ChevronLeft = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRight = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const ChevronDown = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const CheckIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XMarkIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const SparklesIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
)

const ArrowPathIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
)

export interface TrackerWidgetConfig {
  dailyGoal?: number | string
}

export interface TrackerWidgetProps {
  instanceId?: string
  widgetId?: string
  size?: 'compact_1x1' | 'compact_2x1' | 'compact_2x2' | 'expanded'
  appearance?: 'default' | 'transparent' | 'accent' | 'custom'
  config?: TrackerWidgetConfig
  isEditing?: boolean
  onUpdateConfig?: (patch: Record<string, any>) => void
  autoOpenSettings?: boolean
  onSettingsClose?: () => void
}

export function openChapterInMomAI(bookId: number, chapter: number): void {
  const book = bibleData.getBookById(bookId)
  if (book) {
    bibleStorage.setLastReading({
      bookId,
      bookName: book.name,
      bookAbbrev: book.abbrev,
      testament: book.testament,
      chapter,
      verse: 1,
      updatedAt: Date.now()
    })
  }

  try {
    sessionStorage.setItem(
      'momai_biblia_pending_nav',
      JSON.stringify({ bookId, chapter, tab: 'reading' })
    )
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('momai_biblia_navigate', {
        detail: { bookId, chapter, tab: 'reading' }
      })
    )
    window.dispatchEvent(
      new CustomEvent('momai_navigate', {
        detail: { path: '/extensions/momai-biblia-sagrada', state: { bookId, chapter, tab: 'reading' } }
      })
    )
    window.dispatchEvent(
      new CustomEvent('momai_window_action', {
        detail: { action: 'restore' }
      })
    )
  }
}

export default function BibleTrackerWidget({
  instanceId,
  widgetId,
  config
}: TrackerWidgetProps): JSX.Element {
  const { t, getBookName } = useBibleI18n()
  const [tracker, setTracker] = useState<BibleDailyTracker>(() => bibleStorage.getDailyTracker())
  const [showInfo, setShowInfo] = useState(false)
  const [isBookListOpen, setIsBookListOpen] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false)
  const [testamentTab, setTestamentTab] = useState<'ALL' | 'AT' | 'NT'>('ALL')
  const [readingExtra, setReadingExtra] = useState(false)
  const textContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bookButtonRef = useRef<HTMLButtonElement>(null)

  const effectiveGoal = useMemo(() => {
    if (config?.dailyGoal !== undefined && config?.dailyGoal !== null) {
      const num = Number(config.dailyGoal)
      if (Number.isInteger(num) && num >= 1 && num <= 20) return num
    }
    return tracker.dailyGoal || 3
  }, [config?.dailyGoal, tracker.dailyGoal])

  // Sync tracker changes from localStorage / storage events / custom updates
  useEffect(() => {
    const handleUpdate = () => {
      const latest = bibleStorage.getDailyTracker()
      setTracker(latest)
    }

    const handleCustomEvent = (e: Event) => {
      const customEv = e as CustomEvent<BibleDailyTracker>
      if (customEv.detail) {
        setTracker(customEv.detail)
      } else {
        handleUpdate()
      }
    }

    window.addEventListener('momai_biblia_tracker_update', handleCustomEvent)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener('momai_biblia_tracker_update', handleCustomEvent)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // Listen to host context menu actions
  useEffect(() => {
    const handleWidgetAction = (e: Event) => {
      const customEv = e as CustomEvent<{
        actionId?: string
        instanceId?: string
        widgetId?: string
      }>
      const action = customEv.detail?.actionId
      const matchInstance = !customEv.detail?.instanceId || customEv.detail.instanceId === instanceId
      const matchWidget =
        !customEv.detail?.widgetId ||
        customEv.detail.widgetId === widgetId ||
        customEv.detail.widgetId === 'tracker' ||
        customEv.detail.widgetId === 'momai-biblia-tracker-widget'

      if (matchInstance || matchWidget) {
        if (action === 'open_reading') {
          openChapterInMomAI(tracker.currentBookId, tracker.currentChapter)
        } else if (action === 'advance_chapter') {
          const updated = bibleStorage.advanceDailyTracker(effectiveGoal)
          setTracker(updated)
        } else if (action === 'reset_all' || action === 'reset_today') {
          const updated = bibleStorage.resetEntireBibleReading()
          setTracker(updated)
          setReadingExtra(false)
        }
      }
    }

    window.addEventListener('momai_widget_action', handleWidgetAction)
    return () => {
      window.removeEventListener('momai_widget_action', handleWidgetAction)
    }
  }, [instanceId, widgetId, tracker.currentBookId, tracker.currentChapter, effectiveGoal])

  // Scroll to top when changing reading chapter
  useEffect(() => {
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0
    }
  }, [tracker.currentBookId, tracker.currentChapter])

  const currentBook = useMemo(() => {
    return bibleData.getBookById(tracker.currentBookId) || bibleData.getBookById(1)!
  }, [tracker.currentBookId])

  const currentBookLocalizedName = useMemo(() => {
    return getBookName(tracker.currentBookId, currentBook.name)
  }, [tracker.currentBookId, currentBook.name, getBookName])

  const readingVerses: BibleVerse[] = useMemo(() => {
    return bibleData.getChapterVerses(tracker.currentBookId, tracker.currentChapter)
  }, [tracker.currentBookId, tracker.currentChapter])

  const canPrev = useMemo(() => {
    return bibleData.getPrevChapter(tracker.currentBookId, tracker.currentChapter) !== null
  }, [tracker.currentBookId, tracker.currentChapter])

  const canNext = useMemo(() => {
    return bibleData.getNextChapter(tracker.currentBookId, tracker.currentChapter) !== null
  }, [tracker.currentBookId, tracker.currentChapter])

  const handlePrevChapter = useCallback(() => {
    const prev = bibleData.getPrevChapter(tracker.currentBookId, tracker.currentChapter)
    if (!prev) return
    const updated: BibleDailyTracker = {
      ...tracker,
      currentBookId: prev.bookId,
      currentChapter: prev.chapter
    }
    bibleStorage.setDailyTracker(updated)
    setTracker(updated)
  }, [tracker])

  const handleNextChapter = useCallback(() => {
    const next = bibleData.getNextChapter(tracker.currentBookId, tracker.currentChapter)
    if (!next) return
    const updated: BibleDailyTracker = {
      ...tracker,
      currentBookId: next.bookId,
      currentChapter: next.chapter
    }
    bibleStorage.setDailyTracker(updated)
    setTracker(updated)
  }, [tracker])

  const handleAdvance = useCallback(() => {
    const updated = bibleStorage.advanceDailyTracker(effectiveGoal)
    setTracker(updated)
  }, [effectiveGoal])

  const handleResetAll = useCallback(() => {
    const updated = bibleStorage.resetEntireBibleReading()
    setTracker(updated)
    setReadingExtra(false)
    setShowInfo(false)
    setShowResetConfirmModal(false)
  }, [])

  const oldTestamentBooks = useMemo(() => bibleData.getOldTestamentBooks(), [])
  const newTestamentBooks = useMemo(() => bibleData.getNewTestamentBooks(), [])

  const handleSelectBook = useCallback((bookId: number) => {
    const updated: BibleDailyTracker = {
      ...tracker,
      currentBookId: bookId,
      currentChapter: 1
    }
    bibleStorage.setDailyTracker(updated)
    setTracker(updated)
    setIsBookListOpen(false)
  }, [tracker])

  // Close modals/dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bookButtonRef.current &&
        !bookButtonRef.current.contains(e.target as Node)
      ) {
        setIsBookListOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBookListOpen(false)
        setShowConfirmModal(false)
        setShowResetConfirmModal(false)
      }
    }
    if (isBookListOpen || showConfirmModal || showResetConfirmModal) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isBookListOpen, showConfirmModal, showResetConfirmModal])

  const isGoalDone = tracker.completedToday >= effectiveGoal
  const showCelebration = isGoalDone && !readingExtra
  const overallPercent = Math.min(100, Math.round((tracker.totalChaptersRead / 1189) * 1000) / 10)

  // ==========================================
  // VIEW 1: CELEBRATION VIEW (WHEN GOAL IS MET)
  // ==========================================
  if (showCelebration) {
    return (
      <div className="w-full h-full flex flex-col p-3 select-none text-text relative overflow-hidden">
        {/* Top Header: Badge + Collapsible info */}
        <div className="shrink-0 mb-1.5 flex flex-col gap-1.5">
          <div className="flex justify-end">
            <div className="flex items-center gap-1.5 shrink-0">
              {tracker.streakDays > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-card text-text border border-border"
                  title={t('widget.tracker.streak_tooltip', { count: tracker.streakDays })}
                >
                  <FlameIcon className="w-2.5 h-2.5 text-text" />
                  <span>{t('widget.tracker.streak_days', { count: tracker.streakDays })}</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-card text-text border border-border hover:bg-card-hover transition-all cursor-pointer shadow-xs"
                title={t('widget.tracker.goal_badge_tooltip_done', { count: tracker.completedToday })}
                aria-label={t('widget.tracker.goal_completed_title')}
              >
                <CheckIcon className="w-3 h-3 text-text" />
                <span>{t('widget.tracker.goal_badge')}</span>
              </button>
            </div>
          </div>

          {showInfo && (
            <div
              className="p-2.5 rounded-xl bg-card border border-border shadow-xs animate-in fade-in duration-150 text-center space-y-2"
            >
              <div
                onClick={() => setShowInfo(false)}
                className="cursor-pointer space-y-0.5"
                title={t('widget.tracker.details_close_tooltip')}
              >
                <p className="text-xs font-semibold text-text">
                  {tracker.completedToday === 1
                    ? t('widget.tracker.details_title_done_one', { count: tracker.completedToday })
                    : t('widget.tracker.details_title_done_other', { count: tracker.completedToday })}
                </p>
                <p className="text-[11px] text-text-muted">
                  {t('widget.tracker.details_overall', { percent: overallPercent, read: tracker.totalChaptersRead })}
                </p>
              </div>

              <div className="pt-1.5 border-t border-border flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-text-muted hover:text-text hover:bg-input/60 border border-transparent hover:border-border transition-all cursor-pointer active:scale-95"
                  title={t('widget.tracker.restart_reading_tooltip')}
                >
                  <ArrowPathIcon className="w-3 h-3" />
                  <span>{t('widget.tracker.restart_reading_button')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Centered Celebration Content */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center text-center gap-3.5 px-2 my-auto">
          <div className="w-11 h-11 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-accent shadow-xs shrink-0 transition-transform duration-300 hover:scale-110">
            <SparklesIcon className="w-5 h-5 text-accent" />
          </div>

          <div className="space-y-1 max-w-xs">
            <h3 className="text-base sm:text-lg font-bold text-text leading-snug">
              {t('widget.tracker.goal_completed_title')}
            </h3>
            <p className="text-xs text-text-muted">
              {tracker.completedToday === 1
                ? t('widget.tracker.goal_completed_desc_one', { count: tracker.completedToday })
                : t('widget.tracker.goal_completed_desc_other', { count: tracker.completedToday })}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setReadingExtra(true)}
              className="px-3.5 py-2 rounded-xl bg-card hover:bg-card-hover border border-border font-semibold text-xs text-text transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              {t('widget.tracker.read_extra_button')}
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-input/60 hover:bg-input border border-border font-medium text-xs text-text-muted hover:text-text transition-all active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              title={t('widget.tracker.restart_reading_tooltip')}
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>{t('widget.tracker.restart_reading_button')}</span>
            </button>
          </div>
        </div>

        {/* Modal de Confirmação para Reiniciar a Leitura Bíblica (na tela de celebração) */}
        {showResetConfirmModal && (
          <div
            className="absolute inset-0 z-50 bg-card p-4 flex flex-col items-center justify-center text-center text-text rounded-2xl animate-in fade-in duration-200 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-text-muted hover:text-text hover:bg-input/60 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer z-10"
              title={t('widget.tracker.close')}
              aria-label={t('widget.tracker.close')}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            <div className="w-full max-w-xs flex flex-col items-center gap-3.5 px-2 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-text shadow-xs transition-transform duration-300 hover:scale-110 shrink-0">
                <ArrowPathIcon className="w-6 h-6 stroke-2" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-text tracking-tight">
                  {t('widget.tracker.restart_modal_title')}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
                  {t('widget.tracker.restart_modal_desc', { genesis: `${getBookName(1, 'Gênesis')} 1` })}
                </p>
              </div>

              <div className="w-full flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-input/60 hover:bg-input border border-border font-medium text-xs text-text-muted hover:text-text transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-xs"
                >
                  {t('widget.tracker.cancel_button')}
                </button>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="group flex-1 py-2 px-3 rounded-xl bg-card hover:bg-card-hover border border-border font-bold text-xs text-text transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                  <span>{t('widget.tracker.restart_all_button')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // VIEW 2: DIRECT SCRIPTURE READING VIEW
  // ==========================================
  return (
    <div className="w-full h-full flex flex-col p-3 select-none text-text relative overflow-hidden">
      {/* Top Header: Navigation arrows + Chapter Title + Goal Badge */}
      <div className="shrink-0 mb-1.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1.5">
          {/* Chapter Navigation (< Book Chapter >) */}
          <div className="flex items-center gap-0.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={handlePrevChapter}
              disabled={!canPrev}
              className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-card-hover border border-transparent hover:border-border disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              title={t('widget.tracker.prev_chapter_tooltip')}
              aria-label={t('widget.tracker.prev_chapter_tooltip')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              ref={bookButtonRef}
              type="button"
              onClick={() => {
                setIsBookListOpen((prev) => !prev)
                setShowInfo(false)
              }}
              className="flex items-center gap-1 px-1 py-0.5 rounded-lg text-xs font-bold text-text hover:bg-card-hover border border-transparent hover:border-border transition-all cursor-pointer truncate max-w-full"
              title={t('widget.tracker.select_book_tooltip')}
              aria-expanded={isBookListOpen}
              aria-haspopup="listbox"
            >
              <span className="truncate">{currentBookLocalizedName} {tracker.currentChapter}</span>
              <ChevronDown className={`w-3 h-3 text-text-muted shrink-0 transition-transform duration-200 ${isBookListOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleNextChapter}
              disabled={!canNext}
              className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-card-hover border border-transparent hover:border-border disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shrink-0"
              title={t('widget.tracker.next_chapter_tooltip')}
              aria-label={t('widget.tracker.next_chapter_tooltip')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right side: Streak badge + Goal Badge */}
          <div className="flex items-center gap-1 shrink-0">
            {tracker.streakDays > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-card text-text border border-border"
                title={t('widget.tracker.streak_tooltip', { count: tracker.streakDays })}
              >
                <FlameIcon className="w-2.5 h-2.5 text-text" />
                <span>{t('widget.tracker.streak_days', { count: tracker.streakDays })}</span>
              </span>
            )}

            {isGoalDone ? (
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-card text-text border border-border hover:bg-card-hover transition-all cursor-pointer shadow-xs"
                title={t('widget.tracker.goal_badge_tooltip_done', { count: tracker.completedToday })}
                aria-label={t('widget.tracker.goal_completed_title')}
              >
                <CheckIcon className="w-3 h-3 text-text" />
                <span>{t('widget.tracker.goal_badge')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-card hover:bg-card-hover border border-border text-text transition-all cursor-pointer shadow-xs"
                title={t('widget.tracker.goal_badge_tooltip_progress')}
                aria-label={t('widget.tracker.goal_badge_progress', { completed: tracker.completedToday, goal: effectiveGoal })}
              >
                {t('widget.tracker.goal_badge_progress', { completed: tracker.completedToday, goal: effectiveGoal })}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Info Drawer */}
        {showInfo && (
          <div
            className="p-2.5 rounded-xl bg-card border border-border shadow-xs animate-in fade-in duration-150 text-center space-y-2"
          >
            <div
              onClick={() => setShowInfo(false)}
              className="cursor-pointer space-y-0.5"
              title={t('widget.tracker.details_close_tooltip')}
            >
              <p className="text-xs font-semibold text-text">
                {isGoalDone
                  ? (tracker.completedToday === 1
                      ? t('widget.tracker.details_title_done_one', { count: tracker.completedToday })
                      : t('widget.tracker.details_title_done_other', { count: tracker.completedToday }))
                  : (effectiveGoal === 1
                      ? t('widget.tracker.details_title_progress_one', { completed: tracker.completedToday, goal: effectiveGoal })
                      : t('widget.tracker.details_title_progress_other', { completed: tracker.completedToday, goal: effectiveGoal }))}
              </p>
              <p className="text-[11px] text-text-muted">
                {t('widget.tracker.details_overall', { percent: overallPercent, read: tracker.totalChaptersRead })}
              </p>
            </div>

            <div className="pt-1.5 border-t border-border flex justify-center">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-text-muted hover:text-text hover:bg-input/60 border border-transparent hover:border-border transition-all cursor-pointer active:scale-95"
                title={t('widget.tracker.restart_reading_tooltip')}
              >
                <ArrowPathIcon className="w-3 h-3" />
                <span>{t('widget.tracker.restart_reading_button')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Verses Reading Area */}
      <div
        ref={textContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-1 py-1 space-y-2 select-text custom-scrollbar text-[13px] sm:text-sm leading-relaxed"
      >
        {readingVerses.length > 0 ? (
          readingVerses.map((verse) => (
            <p key={verse.id} className="text-text text-justify">
              <sup className="font-semibold text-text mr-1.5 select-none text-[10px]">
                {verse.verse}
              </sup>
              <span>{verse.text}</span>
            </p>
          ))
        ) : (
          <div className="text-center py-10 text-text-muted text-xs">
            {t('widget.tracker.loading_text')}
          </div>
        )}
      </div>

      {/* Bottom Action: Marcar como lido */}
      <div className="pt-2 shrink-0 flex justify-center">
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="w-full max-w-sm py-2 px-4 rounded-xl bg-card hover:bg-card-hover border border-border font-medium text-xs text-text transition-all active:scale-95 cursor-pointer shadow-xs text-center"
        >
          {t('widget.tracker.mark_as_read')}
        </button>
      </div>

      {/* Modal / Tela de Confirmação da Leitura (Centralizado, coeso e compacto) */}
      {showConfirmModal && (
        <div
          className="absolute inset-0 z-50 bg-card p-4 flex flex-col items-center justify-center text-center text-text rounded-2xl animate-in fade-in duration-200 overflow-hidden"
        >
          {/* Botão fechar no topo direito */}
          <button
            type="button"
            onClick={() => setShowConfirmModal(false)}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-text-muted hover:text-text hover:bg-input/60 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer z-10"
            title={t('widget.tracker.close')}
            aria-label={t('widget.tracker.close')}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          {/* Conteúdo Central Unificado: Ícone + Textos + Ações Próximas */}
          <div className="w-full max-w-xs flex flex-col items-center gap-3.5 px-2 my-auto">
            {/* Ícone */}
            <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-text shadow-xs transition-transform duration-300 hover:scale-110 shrink-0">
              <CheckIcon className="w-6 h-6 stroke-2" />
            </div>

            {/* Título e Texto */}
            <div className="space-y-1">
              <h4 className="text-base font-bold text-text tracking-tight">
                {t('widget.tracker.confirm_title')}
              </h4>
              <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
                {t('widget.tracker.confirm_desc', { book: currentBookLocalizedName, chapter: tracker.currentChapter })}
              </p>
            </div>

            {/* Botões de Ação Próximos ao Texto */}
            <div className="w-full flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-input/60 hover:bg-input border border-border font-medium text-xs text-text-muted hover:text-text transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-xs"
              >
                {t('widget.tracker.cancel_button')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  handleAdvance()
                }}
                className="group flex-1 py-2 px-3 rounded-xl bg-card hover:bg-card-hover border border-border font-bold text-xs text-text transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <CheckIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-6" />
                <span>{t('widget.tracker.confirm_button')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Reiniciar a Leitura Bíblica (no modo leitura) */}
      {showResetConfirmModal && (
        <div
          className="absolute inset-0 z-50 bg-card p-4 flex flex-col items-center justify-center text-center text-text rounded-2xl animate-in fade-in duration-200 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(false)}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-text-muted hover:text-text hover:bg-input/60 transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer z-10"
            title={t('widget.tracker.close')}
            aria-label={t('widget.tracker.close')}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          <div className="w-full max-w-xs flex flex-col items-center gap-3.5 px-2 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-text shadow-xs transition-transform duration-300 hover:scale-110 shrink-0">
              <ArrowPathIcon className="w-6 h-6 stroke-2" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-text tracking-tight">
                {t('widget.tracker.restart_modal_title')}
              </h4>
              <p className="text-xs text-text-muted leading-relaxed max-w-[240px]">
                {t('widget.tracker.restart_modal_desc', { genesis: `${getBookName(1, 'Gênesis')} 1` })}
              </p>
            </div>

            <div className="w-full flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-input/60 hover:bg-input border border-border font-medium text-xs text-text-muted hover:text-text transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer text-center shadow-xs"
              >
                {t('widget.tracker.cancel_button')}
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="group flex-1 py-2 px-3 rounded-xl bg-card hover:bg-card-hover border border-border font-bold text-xs text-text transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <ArrowPathIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180" />
                <span>{t('widget.tracker.restart_all_button')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown / Modal de Seleção de Livros (Overlay total dentro do widget com scroll garantido) */}
      {isBookListOpen && (
        <div
          ref={dropdownRef}
          className="absolute inset-0 z-40 bg-card p-2.5 flex flex-col rounded-2xl shadow-2xl animate-in fade-in duration-150 text-text overflow-hidden"
        >
          {/* Header Fixo Completo (Título, Fechar e Tabs) */}
          <div className="shrink-0 bg-card z-20 pb-2 border-b border-border flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text">
                {t('widget.tracker.select_book_title')}
              </span>
              <button
                type="button"
                onClick={() => setIsBookListOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-card-hover transition-colors cursor-pointer"
                title={t('widget.tracker.close')}
                aria-label={t('widget.tracker.close')}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs de Filtro de Testamento */}
            <div className="flex items-center p-1 gap-1 border border-border bg-input/40 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setTestamentTab('ALL')}
                className={`flex-1 py-1 px-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer text-center truncate ${
                  testamentTab === 'ALL'
                    ? 'bg-card text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t('home.search_filter_all')} (66)
              </button>
              <button
                type="button"
                onClick={() => setTestamentTab('AT')}
                className={`flex-1 py-1 px-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer text-center truncate ${
                  testamentTab === 'AT'
                    ? 'bg-card text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t('home.old_testament')} (39)
              </button>
              <button
                type="button"
                onClick={() => setTestamentTab('NT')}
                className={`flex-1 py-1 px-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer text-center truncate ${
                  testamentTab === 'NT'
                    ? 'bg-card text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t('home.new_testament')} (27)
              </button>
            </div>
          </div>

          {/* Lista com Scroll dos Livros */}
          <div
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 py-2 pb-6 space-y-2 select-none custom-scrollbar [scrollbar-width:thin]"
            style={{ maxHeight: '100%' }}
          >
            {(testamentTab === 'ALL' || testamentTab === 'AT') && (
              <div className="space-y-1.5">
                {testamentTab === 'ALL' && (
                  <div className="px-2 py-1 bg-input/50 rounded-lg text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {t('home.old_testament')}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {oldTestamentBooks.map((book) => {
                    const isSelected = book.id === tracker.currentBookId
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleSelectBook(book.id)}
                        className={`px-2 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer truncate flex items-center justify-between ${
                          isSelected
                            ? 'bg-input text-text font-bold border border-border shadow-xs'
                            : 'hover:bg-card-hover text-text border border-transparent'
                        }`}
                        title={`${getBookName(book.id, book.name)} (${book.totalChapters} cap)`}
                      >
                        <span className="truncate">{getBookName(book.id, book.name)}</span>
                        {isSelected && <CheckIcon className="w-3 h-3 text-text shrink-0 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {(testamentTab === 'ALL' || testamentTab === 'NT') && (
              <div className="space-y-1.5 mt-2">
                {testamentTab === 'ALL' && (
                  <div className="px-2 py-1 bg-input/50 rounded-lg text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {t('home.new_testament')}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {newTestamentBooks.map((book) => {
                    const isSelected = book.id === tracker.currentBookId
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleSelectBook(book.id)}
                        className={`px-2 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer truncate flex items-center justify-between ${
                          isSelected
                            ? 'bg-input text-text font-bold border border-border shadow-xs'
                            : 'hover:bg-card-hover text-text border border-transparent'
                        }`}
                        title={`${getBookName(book.id, book.name)} (${book.totalChapters} cap)`}
                      >
                        <span className="truncate">{getBookName(book.id, book.name)}</span>
                        {isSelected && <CheckIcon className="w-3 h-3 text-text shrink-0 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

BibleTrackerWidget.contextMenu = [
  {
    id: 'open_reading',
    label: 'Abrir no Aplicativo MomAI',
    action: 'open_reading'
  },
  {
    id: 'advance_chapter',
    label: 'Marcar como Lido',
    action: 'advance_chapter'
  },
  {
    id: 'reset_all',
    label: 'Reiniciar Toda a Leitura Bíblica',
    action: 'reset_all'
  }
]

BibleTrackerWidget.customization = {
  isCustomized: (config?: Record<string, unknown>) =>
    Boolean(config && config.dailyGoal !== undefined && config.dailyGoal !== 3),
  title: 'Personalizar Leitura Bíblica',
  defaults: { dailyGoal: 3 },
  options: [
    {
      key: 'dailyGoal',
      kind: 'select',
      label: 'Meta Diária de Capítulos',
      options: [
        { value: '1', label: '1 capítulo por dia' },
        { value: '2', label: '2 capítulos por dia' },
        { value: '3', label: '3 capítulos por dia' },
        { value: '4', label: '4 capítulos por dia' },
        { value: '5', label: '5 capítulos por dia' }
      ]
    }
  ]
}
