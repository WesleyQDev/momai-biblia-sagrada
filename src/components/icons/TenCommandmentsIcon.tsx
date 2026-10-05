import React from 'react'

export const TenCommandmentsIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sombra de apoio no chão */}
      <ellipse cx="32" cy="56" rx="22" ry="3" fill="#0f172a" fillOpacity="0.25" />

      {/* Tábua Esquerda (Pedra Cinza com Relevo e Sombra 3D) */}
      <path
        d="M10 20C10 13 15.5 8 22 8C28.5 8 31 13 31 20V54C31 55.5 29.8 56 28.5 56H12.5C11.2 56 10 55.5 10 54V20Z"
        fill="#64748b"
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Corpo interno e relevo de pedra esquerda */}
      <path
        d="M12 20C12 14.5 16.5 10 22 10C27 10 29 14 29.5 19.5V54H12.5C12.2 54 12 53.8 12 53.5V20Z"
        fill="#6b7280"
      />
      {/* Realce Superior Esquerdo */}
      <path
        d="M11.5 20C11.5 14 16 9.5 22 9.5C26.5 9.5 29 13 29.5 18"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Tábua Direita (Pedra Cinza com Relevo e Sombra 3D) */}
      <path
        d="M33 20C33 13 35.5 8 42 8C48.5 8 54 13 54 20V54C54 55.5 52.8 56 51.5 56H35.5C34.2 56 33 55.5 33 54V20Z"
        fill="#475569"
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Corpo interno e relevo de pedra direita */}
      <path
        d="M34.5 20C34.5 14.5 37 10 42 10C47 10 51.5 14 52 19.5V54H35.5C35 54 34.5 53.8 34.5 53.5V20Z"
        fill="#5d6472"
      />
      {/* Realce Superior Direito */}
      <path
        d="M34.5 20C34.5 14 37 9.5 42 9.5C47 9.5 51.5 13 52 18"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Numerais Romanos Gravados na Pedra (Cor Escura de Cinzel) */}
      {/* Tábua 1: I, II, III, IV, V */}
      {/* I */}
      <line x1="19" y1="18" x2="22" y2="18" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20.5" y1="18" x2="20.5" y2="22" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="22" x2="22" y2="22" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

      {/* II */}
      <line x1="17.5" y1="26" x2="23.5" y2="26" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="26" x2="19" y2="30" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="22" y1="26" x2="22" y2="30" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17.5" y1="30" x2="23.5" y2="30" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

      {/* III */}
      <line x1="16.5" y1="34" x2="24.5" y2="34" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="34" x2="18" y2="38" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20.5" y1="34" x2="20.5" y2="38" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="34" x2="23" y2="38" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16.5" y1="38" x2="24.5" y2="38" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />

      {/* IV */}
      <path d="M17 42V46M19.5 42L22 46L24.5 42" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* V */}
      <path d="M18.5 49L20.5 53L22.5 49" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* Tábua 2: VI, VII, VIII, IX, X */}
      {/* VI */}
      <path d="M39 18L41 22L43 18M45.5 18V22" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* VII */}
      <path d="M38 26L40 30L42 26M44.5 26V30M47.5 26V30" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* VIII */}
      <path d="M37 34L39 38L41 34M43 34V38M45.5 34V38M48 34V38" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* IX */}
      <path d="M39.5 42V46M42 42L46 46M46 42L42 46" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      {/* X */}
      <path d="M41 49L45 53M45 49L41 53" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
