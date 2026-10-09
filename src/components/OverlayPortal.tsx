import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface OverlayPortalProps {
  children: React.ReactNode
  /**
   * Legacy fallback only: while the host provides no overlay root (unit tests,
   * older hosts) the overlay stays fixed to the window, optionally starting
   * below the title bar.
   */
  legacyTopPx?: number
}

/**
 * Renders a full-area overlay inside the host-provided container
 * (sdk.ui.overlayRoot) so it can never cover the host chrome (sidebar, title
 * bar). Falls back to a window-fixed layer when the host exposes none.
 *
 * Children should position themselves with `absolute inset-0`.
 */
export function OverlayPortal({ children, legacyTopPx }: OverlayPortalProps): React.ReactElement {
  const [root, setRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const sdk = (window as Window & { MomAISDK?: { ui?: { overlayRoot?: () => HTMLElement | null } } })
      .MomAISDK
    setRoot(sdk?.ui?.overlayRoot?.() ?? null)
  }, [])

  if (root) {
    return createPortal(
      <div className="absolute inset-0 pointer-events-auto" data-overlay-portal="">
        {children}
      </div>,
      root
    )
  }

  return (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={legacyTopPx !== undefined ? { top: `${legacyTopPx}px` } : undefined}
    >
      {children}
    </div>
  )
}
