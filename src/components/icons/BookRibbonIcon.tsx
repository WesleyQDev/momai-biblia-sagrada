import React from 'react'

export const BookRibbonIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="bookCoverGrad" x1="14" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id="bookSpineGrad" x1="14" y1="10" x2="22" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#301202" />
        </linearGradient>
        <linearGradient id="redRibbonGrad" x1="36" y1="8" x2="46" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* Miolo / Páginas de Papel Creme na Borda */}
      <rect x="18" y="14" width="34" height="38" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
      <line x1="49" y1="16" x2="49" y2="50" stroke="#d97706" strokeWidth="1" strokeDasharray="1.5 1.5" />

      {/* Capa de Couro Marrom Principal */}
      <rect
        x="14"
        y="10"
        width="35"
        height="44"
        rx="5"
        fill="url(#bookCoverGrad)"
        stroke="#270e02"
        strokeWidth="2.5"
      />

      {/* Lombada de Couro Escuro à Esquerda */}
      <path
        d="M14 15C14 12.2386 16.2386 10 19 10H22V54H19C16.2386 54 14 51.7614 14 49V15Z"
        fill="url(#bookSpineGrad)"
        stroke="#270e02"
        strokeWidth="2"
      />

      {/* Costuras/Frisos Dourados na Lombada */}
      <line x1="16" y1="18" x2="20" y2="18" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="28" x2="20" y2="28" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="36" x2="20" y2="36" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="46" x2="20" y2="46" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

      {/* Fita Marcadora Vermelha Vibrante (Marcador de Página) */}
      <path
        d="M36 8V33L41 28L46 33V8H36Z"
        fill="url(#redRibbonGrad)"
        stroke="#7f1d1d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Brilho da fita */}
      <path d="M38 8V29L41 26" stroke="#fca5a5" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
