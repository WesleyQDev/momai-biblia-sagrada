import React from 'react'

export const TenCommandmentsIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="stoneGrad" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="40%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="stoneLight" x1="10" y1="8" x2="31" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>

      {/* Tábua Esquerda (Pedra Cinza) */}
      <path
        d="M10 20C10 13 15.5 8 22 8C28.5 8 31 13 31 20V54C31 55.5 29.8 56 28.5 56H12.5C11.2 56 10 55.5 10 54V20Z"
        fill="url(#stoneGrad)"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Realce Superior Esquerdo */}
      <path
        d="M11 20C11 14 16 9.5 22 9.5C27 9.5 29.5 13.5 30 19"
        stroke="#e5e7eb"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Tábua Direita (Pedra Cinza) */}
      <path
        d="M33 20C33 13 35.5 8 42 8C48.5 8 54 13 54 20V54C54 55.5 52.8 56 51.5 56H35.5C34.2 56 33 55.5 33 54V20Z"
        fill="url(#stoneGrad)"
        stroke="#1f2937"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Realce Superior Direito */}
      <path
        d="M34 20C34 14 36.5 9.5 42 9.5C47.5 9.5 52.5 13.5 53 19"
        stroke="#e5e7eb"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Numerais Romanos Gravados na Pedra (Cor Escura de Cinzel) */}
      {/* Tábua 1: I, II, III, IV, V */}
      {/* I */}
      <line x1="19" y1="18" x2="22" y2="18" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20.5" y1="18" x2="20.5" y2="22" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="22" x2="22" y2="22" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />

      {/* II */}
      <line x1="17.5" y1="26" x2="23.5" y2="26" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="26" x2="19" y2="30" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="26" x2="22" y2="30" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17.5" y1="30" x2="23.5" y2="30" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />

      {/* III */}
      <line x1="16.5" y1="34" x2="24.5" y2="34" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="34" x2="18" y2="38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20.5" y1="34" x2="20.5" y2="38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="34" x2="23" y2="38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16.5" y1="38" x2="24.5" y2="38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" />

      {/* IV */}
      <path d="M17 42V46M19.5 42L22 46L24.5 42" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* V */}
      <path d="M18.5 49L20.5 53L22.5 49" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Tábua 2: VI, VII, VIII, IX, X */}
      {/* VI */}
      <path d="M39 18L41 22L43 18M45.5 18V22" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* VII */}
      <path d="M38 26L40 30L42 26M44.5 26V30M47.5 26V30" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* VIII */}
      <path d="M37 34L39 38L41 34M43 34V38M45.5 34V38M48 34V38" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* IX */}
      <path d="M39.5 42V46M42 42L46 46M46 42L42 46" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* X */}
      <path d="M41 49L45 53M45 49L41 53" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
