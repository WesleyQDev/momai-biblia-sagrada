import React from 'react'

export const HarpIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Brilho dourado atrás das cordas */}
      <ellipse cx="32" cy="35" rx="12" ry="16" fill="#fef08a" fillOpacity="0.25" />

      {/* Base Circular (Metálica com relevo) */}
      <ellipse cx="32" cy="59" rx="15" ry="3" fill="#1f2937" fillOpacity="0.3" />
      <ellipse cx="32" cy="57" rx="14" ry="3.5" fill="#9ca3af" stroke="#4b5563" strokeWidth="0.8" />
      <ellipse cx="32" cy="56.5" rx="11" ry="2.5" fill="#d1d5db" stroke="#6b7280" strokeWidth="0.5" />
      <ellipse cx="32" cy="56" rx="8" ry="1.8" fill="#e5e7eb" />

      {/* Caixa de Ressonância / Soundboard (Madeira Dourada/Âmbar) */}
      <path
        d="M42 16C47 22 49 30 48 40C47 47 44 52 40 55C38 56 36.5 55.5 36 54C37 50 38.5 44 39 37C39.5 30 39 23 37 18C38.5 16 40.5 15.2 42 16Z"
        fill="#b45309"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Realce interno do soundboard */}
      <path
        d="M41 18C45 23 46.5 30 45.5 39C44.5 45 42 50 39 53C37.5 54 36.5 53 36.5 51C37.5 46 38.5 41 39 36C39.5 30 39 23 37.5 19C38.8 17.5 40 17 41 18Z"
        fill="#d97706"
      />
      {/* Borda de realce do soundboard */}
      <path
        d="M37.5 19C38 25 38.5 32 38 39C37.5 45 37 50.5 36.5 53"
        stroke="#fde68a"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Curva Harmônica / Neck (Pescoço Curvado em Ouro/Madeira) */}
      <path
        d="M19 14C19 10 22 7 27 7C32 7.5 37 10 42 15C41.5 17 40 17.5 38.5 16.5C35 13.5 31 11.5 27.5 11C24.5 10.5 22.5 12 22 14.5C21.5 16 20.5 17.5 19 18L19 14Z"
        fill="#d97706"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Arco de luz no topo do neck */}
      <path
        d="M20 12C21.5 9 24.5 7.8 28 8.2C33 9 37.5 11.5 41 14.5"
        stroke="#FEF9C3"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Coluna / Pilar Frontal (Esquerda) */}
      <path
        d="M19 14C18 14 17 15 17 16.5C17 18 17.5 22 18 28C18.5 34 19 40 19.5 46C20 50 20.5 53 21.5 55C22.5 56.5 24 56 24.5 54.5C24 52 23.5 48 23 42C22.5 36 22 28 21.5 22C21.2 18 21 15.5 20.5 14.5C20 14 19.5 14 19 14Z"
        fill="#f59e0b"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Linha de brilho central do pilar */}
      <path
        d="M19.8 17C20 22 20.5 30 21 38C21.5 44 22 50 22.5 53.5"
        stroke="#FEF9C3"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Coroa / Topo do Pilar */}
      <circle cx="19" cy="13" r="2.5" fill="#f59e0b" stroke="#78350F" strokeWidth="1" />
      <circle cx="19" cy="13" r="1" fill="#FEF3C7" />

      {/* Cravilhas de afinação no pescoço */}
      <circle cx="24.5" cy="10.5" r="0.7" fill="#5B210B" />
      <circle cx="27.5" cy="9.8" r="0.7" fill="#5B210B" />
      <circle cx="30.5" cy="10" r="0.7" fill="#5B210B" />
      <circle cx="33" cy="11" r="0.7" fill="#5B210B" />
      <circle cx="35.5" cy="12.5" r="0.7" fill="#5B210B" />
      <circle cx="37.5" cy="14.2" r="0.7" fill="#5B210B" />
      <circle cx="39.5" cy="16" r="0.7" fill="#5B210B" />

      {/* 7 Cordas Douradas */}
      <g stroke="#facc15" strokeLinecap="round">
        <line x1="24.5" y1="11" x2="26" y2="54" strokeWidth="1" />
        <line x1="27.5" y1="10.2" x2="28.5" y2="53.5" strokeWidth="1" />
        <line x1="30.5" y1="10.5" x2="31" y2="52.5" strokeWidth="0.9" />
        <line x1="33" y1="11.5" x2="33.5" y2="51" strokeWidth="0.9" />
        <line x1="35.5" y1="13" x2="35.8" y2="48.5" strokeWidth="0.8" />
        <line x1="37.5" y1="14.8" x2="37.5" y2="44" strokeWidth="0.75" />
        <line x1="39.5" y1="16.5" x2="39" y2="39" strokeWidth="0.7" />
      </g>

      {/* Pontos de fixação na caixa */}
      <g fill="#FDE68A" stroke="#92400E" strokeWidth="0.4">
        <circle cx="26" cy="54" r="0.6" />
        <circle cx="28.5" cy="53.5" r="0.6" />
        <circle cx="31" cy="52.5" r="0.6" />
        <circle cx="33.5" cy="51" r="0.6" />
        <circle cx="35.8" cy="48.5" r="0.6" />
        <circle cx="37.5" cy="44" r="0.5" />
        <circle cx="39" cy="39" r="0.5" />
      </g>

      {/* Pé conectando a base */}
      <path
        d="M21 55C22 56.5 26 57.5 32 57.5C38 57.5 41 56.5 42 55"
        stroke="#92400E"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22 55.5C25 56.5 28.5 57 32 57C35.5 57 39 56.5 41 55.5"
        fill="#d97706"
        stroke="#78350F"
        strokeWidth="0.6"
      />
    </svg>
  )
}
