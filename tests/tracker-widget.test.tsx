// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import BibleTrackerWidget, { openChapterInMomAI } from '../src/widgets/tracker'
import { bibleStorage, getTodayDateString } from '../src/services/storage'

describe('BibleTrackerWidget', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders direct scripture text with goal badge and mark as read button', () => {
    render(<BibleTrackerWidget />)

    expect(screen.getByText('Meta: 0/3')).toBeTruthy()
    expect(screen.getByText(/No princípio/)).toBeTruthy()
    expect(screen.getByText('Marcar como lido')).toBeTruthy()
  })

  it('toggles top progress details when clicking the goal badge', () => {
    render(<BibleTrackerWidget />)

    // Initially collapsed
    expect(screen.queryByText(/capítulos lidos na Bíblia/)).toBeNull()

    // Click badge to expand
    fireEvent.click(screen.getByText('Meta: 0/3'))
    expect(screen.getByText(/capítulos lidos na Bíblia/)).toBeTruthy()

    // Click to collapse
    fireEvent.click(screen.getByText(/capítulos lidos na Bíblia/))
    expect(screen.queryByText(/capítulos lidos na Bíblia/)).toBeNull()
  })

  it('opens confirmation modal and advances reading progress on confirm', () => {
    render(<BibleTrackerWidget />)

    const markBtn = screen.getByText('Marcar como lido')
    fireEvent.click(markBtn)

    // Confirmation card modal should appear
    expect(screen.getByText('Confirmar Leitura')).toBeTruthy()
    expect(screen.getByText(/Deseja marcar/)).toBeTruthy()

    // Clicking Cancel closes modal without advancing
    const cancelBtn = screen.getByText('Cancelar')
    fireEvent.click(cancelBtn)
    expect(screen.queryByText(/Deseja marcar/)).toBeNull()
    expect(bibleStorage.getDailyTracker().completedToday).toBe(0)

    // Open again and confirm
    fireEvent.click(markBtn)
    const confirmBtn = screen.getByText('Confirmar')
    fireEvent.click(confirmBtn)

    const tracker = bibleStorage.getDailyTracker()
    expect(tracker.completedToday).toBe(1)
    expect(screen.getByText('Meta: 1/3')).toBeTruthy()
  })

  it('navigates chapters forward and backward using header arrows', () => {
    render(<BibleTrackerWidget />)

    expect(screen.getByText(/João 1/)).toBeTruthy()

    const nextBtn = screen.getByLabelText('Próximo capítulo')
    fireEvent.click(nextBtn)

    expect(screen.getByText(/João 2/)).toBeTruthy()

    const prevBtn = screen.getByLabelText('Capítulo anterior')
    fireEvent.click(prevBtn)

    expect(screen.getByText(/João 1/)).toBeTruthy()
  })

  it('opens book selector dropdown, displays Old and New Testament books and selects a book', () => {
    render(<BibleTrackerWidget />)

    const bookSelectBtn = screen.getByTitle('Selecionar livro da Bíblia')
    expect(bookSelectBtn).toBeTruthy()

    // Initially closed
    expect(screen.queryByText('Todos (66)')).toBeNull()

    // Open dropdown
    fireEvent.click(bookSelectBtn)

    // Check tabs
    expect(screen.getByText('Todos (66)')).toBeTruthy()
    expect(screen.getByText('Velho Testamento (39)')).toBeTruthy()
    expect(screen.getByText(/Novo testamento \(27\)/i)).toBeTruthy()

    // Check Old and New testament books are displayed
    expect(screen.getByText('Gênesis')).toBeTruthy()
    expect(screen.getByText('Mateus')).toBeTruthy()
    expect(screen.getByText('Apocalipse')).toBeTruthy()

    // Filter by Novo Testamento
    fireEvent.click(screen.getByText(/Novo testamento \(27\)/i))
    expect(screen.queryByText('Gênesis')).toBeNull()
    expect(screen.getByText('Mateus')).toBeTruthy()

    // Select Mateus
    fireEvent.click(screen.getByText('Mateus'))

    // Dropdown should close and current book should be Mateus 1
    expect(screen.queryByText('Todos (66)')).toBeNull()
    expect(screen.getByText(/Mateus 1/)).toBeTruthy()

    // Check storage updated
    const tracker = bibleStorage.getDailyTracker()
    expect(tracker.currentBookId).toBe(40) // Matthew ID
    expect(tracker.currentChapter).toBe(1)
  })

  it('closes book selector dropdown on Escape key or clicking outside', () => {
    render(<BibleTrackerWidget />)

    const bookSelectBtn = screen.getByTitle('Selecionar livro da Bíblia')
    fireEvent.click(bookSelectBtn)
    expect(screen.getByText('Todos (66)')).toBeTruthy()

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Todos (66)')).toBeNull()

    // Open again and click outside
    fireEvent.click(bookSelectBtn)
    expect(screen.getByText('Todos (66)')).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Todos (66)')).toBeNull()
  })

  it('shows celebration card when all daily goal chapters are completed, allows reading extra or resetting entire reading', () => {
    const today = getTodayDateString()
    bibleStorage.setDailyTracker({
      currentBookId: 40,
      currentChapter: 4,
      dailyGoal: 3,
      completedToday: 3,
      lastActiveDate: today,
      totalChaptersRead: 45,
      streakDays: 5,
      lastStreakDate: today,
      todayCompletedChapters: [
        { bookId: 40, chapter: 1 },
        { bookId: 40, chapter: 2 },
        { bookId: 40, chapter: 3 }
      ]
    })

    render(<BibleTrackerWidget />)

    expect(screen.getByText('Parabéns! Você concluiu sua meta diária de hoje.')).toBeTruthy()
    const extraBtn = screen.getByText('Ler capítulo extra')
    const resetBtn = screen.getByText('Reiniciar leitura bíblica')
    expect(extraBtn).toBeTruthy()
    expect(resetBtn).toBeTruthy()

    // Clicking reset opens confirmation
    fireEvent.click(resetBtn)
    expect(screen.getByText('Reiniciar Leitura Bíblica')).toBeTruthy()
    expect(screen.getByText(/Gênesis 1/)).toBeTruthy()

    // Confirm reset
    const confirmResetBtn = screen.getByText('Reiniciar Tudo')
    fireEvent.click(confirmResetBtn)

    const tracker = bibleStorage.getDailyTracker()
    expect(tracker.completedToday).toBe(0)
    expect(tracker.totalChaptersRead).toBe(0)
    expect(tracker.currentBookId).toBe(1)
    expect(tracker.currentChapter).toBe(1)
    expect(screen.getByText('Meta: 0/3')).toBeTruthy()
  })

  it('allows resetting entire reading from the collapsible info drawer', () => {
    const today = getTodayDateString()
    bibleStorage.setDailyTracker({
      currentBookId: 19,
      currentChapter: 23,
      dailyGoal: 3,
      completedToday: 1,
      lastActiveDate: today,
      totalChaptersRead: 500,
      streakDays: 10,
      lastStreakDate: today,
      todayCompletedChapters: [{ bookId: 19, chapter: 22 }]
    })

    render(<BibleTrackerWidget />)

    // Open info drawer
    fireEvent.click(screen.getByText('Meta: 1/3'))

    // Reset button should be visible
    const resetBtn = screen.getByText('Reiniciar leitura bíblica')
    expect(resetBtn).toBeTruthy()

    // Click reset button to open confirmation modal
    fireEvent.click(resetBtn)
    expect(screen.getByText('Reiniciar Leitura Bíblica')).toBeTruthy()

    // Confirm
    const confirmResetBtn = screen.getByText('Reiniciar Tudo')
    fireEvent.click(confirmResetBtn)

    const tracker = bibleStorage.getDailyTracker()
    expect(tracker.completedToday).toBe(0)
    expect(tracker.totalChaptersRead).toBe(0)
    expect(tracker.currentBookId).toBe(1)
    expect(tracker.currentChapter).toBe(1)
    expect(screen.getByText('Meta: 0/3')).toBeTruthy()
  })

  it('openChapterInMomAI dispatches deep link and navigation events', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    openChapterInMomAI(1, 12)

    expect(sessionStorage.getItem('momai_biblia_pending_nav')).toContain('"bookId":1')
    expect(sessionStorage.getItem('momai_biblia_pending_nav')).toContain('"chapter":12')

    const eventsDispatched = dispatchSpy.mock.calls.map(([ev]) => (ev as Event).type)
    expect(eventsDispatched).toContain('momai_biblia_navigate')
    expect(eventsDispatched).toContain('momai_navigate')
    expect(eventsDispatched).toContain('momai_window_action')

    dispatchSpy.mockRestore()
  })
})
