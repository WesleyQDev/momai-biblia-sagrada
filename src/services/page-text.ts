/**
 * Copy helpers for a whole page: "select all" marks the page with the custom
 * highlight and the menu's copy action copies this exact page text, so the
 * user never depends on the native (Electron) text selection.
 */
export function getPageText(element: HTMLElement | null): string {
  if (!element) return ''
  return (element.textContent || '').replace(/\s+/g, ' ').trim()
}

export function copyPageText(element: HTMLElement | null): boolean {
  const text = getPageText(element)
  if (!text) return false
  try {
    navigator.clipboard?.writeText?.(text)?.catch(() => {})
    return true
  } catch {
    return false
  }
}
