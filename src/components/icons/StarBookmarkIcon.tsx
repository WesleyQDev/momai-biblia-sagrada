import React from 'react'

export const StarBookmarkIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="starGoldFront" x1="32" y1="4" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="starGoldShade" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Sombra Suave */}
      <polygon
        points="32,6 40,23 58,24 44,36 48,54 32,43 16,54 20,36 6,24 24,23"
        fill="none"
        filter="url(#goldGlow)"
      />

      {/* Corpo Dourado Principal */}
      <polygon
        points="32,6 40,23 58,24 44,36 48,54 32,43 16,54 20,36 6,24 24,23"
        fill="url(#starGoldFront)"
        stroke="#d97706"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Facetas de Relevo e Luz (Efeito 3D Dourado Realista do Print) */}
      <polygon points="32,6 32,43 40,23" fill="#fef9c3" fillOpacity="0.8" />
      <polygon points="58,24 32,43 44,36" fill="#fde047" fillOpacity="0.6" />
      <polygon points="48,54 32,43 32,43" fill="#b45309" fillOpacity="0.7" />
      <polygon points="16,54 32,43 20,36" fill="url(#starGoldShade)" />
      <polygon points="6,24 32,43 24,23" fill="#ca8a04" />

      {/* Arestas de brilho */}
      <line x1="32" y1="6" x2="32" y2="43" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="58" y1="24" x2="32" y2="43" stroke="#eab308" strokeWidth="1" strokeLinecap="round" />
      <line x1="48" y1="54" x2="32" y2="43" stroke="#92400e" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="54" x2="32" y2="43" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
      <line x1="6" y1="24" x2="32" y2="43" stroke="#a16207" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
