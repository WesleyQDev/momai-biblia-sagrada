import React from 'react'

export const BookRibbonIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sombra de apoio */}
      <ellipse cx="32" cy="56" rx="20" ry="3.5" fill="#000000" fillOpacity="0.25" />

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
        fill="#78350f"
        stroke="#270e02"
        strokeWidth="2.5"
      />
      {/* Brilho suave na capa */}
      <rect
        x="22"
        y="12"
        width="25"
        height="40"
        rx="3"
        fill="#92400e"
        fillOpacity="0.4"
      />

      {/* Lombada de Couro Escuro à Esquerda */}
      <path
        d="M14 15C14 12.2386 16.2386 10 19 10H22V54H19C16.2386 54 14 51.7614 14 49V15Z"
        fill="#451a03"
        stroke="#270e02"
        strokeWidth="2"
      />

      {/* Costuras/Frisos Dourados na Lombada */}
      <line x1="16" y1="18" x2="20" y2="18" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="28" x2="20" y2="28" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="36" x2="20" y2="36" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="46" x2="20" y2="46" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

      {/* Fita Marcadora Vermelha Vibrante (Marcador de Página) */}
      <path
        d="M36 8V33L41 28L46 33V8H36Z"
        fill="#dc2626"
        stroke="#7f1d1d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Brilho da fita */}
      <path d="M38 8V29L41 26" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" />
      {/* Sombra da fita */}
      <path d="M44 8V31L41 28" stroke="#991b1b" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
