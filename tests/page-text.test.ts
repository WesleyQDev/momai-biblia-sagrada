// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPageText, copyPageText } from '../src/services/page-text'

afterEach(() => {
  delete (window.navigator as unknown as { clipboard?: unknown }).clipboard
})

describe('page text helpers', () => {
  it('normalizes the text content of a single page', () => {
    document.body.innerHTML = `
      <div data-page-content><span>alpha</span>
        <span>beta</span></div>
      <div><span>gamma</span></div>
    `
    const page = document.querySelector('[data-page-content]') as HTMLElement
    expect(getPageText(page)).toBe('alpha beta')
  })

  it('returns an empty string without an element', () => {
    expect(getPageText(null)).toBe('')
  })

  it('copies the whole page text through the clipboard', () => {
    document.body.innerHTML = '<div data-page-content><span>alpha</span> <span>beta</span></div>'
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    Object.defineProperty(window.navigator, 'clipboard', {
      value: clipboard,
      configurable: true
    })
    const page = document.querySelector('[data-page-content]') as HTMLElement
    expect(copyPageText(page)).toBe(true)
    expect(clipboard.writeText).toHaveBeenCalledWith('alpha beta')
  })

  it('does nothing when there is no text to copy', () => {
    expect(copyPageText(null)).toBe(false)
    document.body.innerHTML = '<div data-page-content>   </div>'
    const empty = document.querySelector('[data-page-content]') as HTMLElement
    expect(copyPageText(empty)).toBe(false)
  })
})
