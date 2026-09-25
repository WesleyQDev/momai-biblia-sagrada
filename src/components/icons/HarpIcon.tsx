import React from 'react'

export const HarpIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Rich polished gold body */}
        <linearGradient id="hpGoldBody" x1="18" y1="6" x2="46" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="20%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="80%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Bright highlight for pillar front face */}
        <linearGradient id="hpPillarHighlight" x1="18" y1="10" x2="24" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="30%" stopColor="#D97706" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="75%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Neck / harmonic curve gradient */}
        <linearGradient id="hpNeck" x1="20" y1="6" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#FBBF24" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Soundboard / resonance body */}
        <linearGradient id="hpSoundboard" x1="34" y1="18" x2="50" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="30%" stopColor="#D97706" />
          <stop offset="60%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Soundboard highlight edge */}
        <linearGradient id="hpSoundboardEdge" x1="36" y1="20" x2="44" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Silver base gradient */}
        <linearGradient id="hpBase" x1="16" y1="54" x2="48" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="30%" stopColor="#D1D5DB" />
          <stop offset="50%" stopColor="#F3F4F6" />
          <stop offset="70%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#6B7280" />
        </linearGradient>

        {/* Warm golden glow behind strings */}
        <radialGradient id="hpGlow" cx="32" cy="34" r="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
        </radialGradient>

        {/* String shimmer */}
        <linearGradient id="hpString" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.6" />
          <stop offset="30%" stopColor="#FDE68A" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#FBBF24" stopOpacity="1" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Subtle golden glow behind strings area */}
      <ellipse cx="32" cy="35" rx="12" ry="16" fill="url(#hpGlow)" />

      {/* === CIRCULAR BASE (metallic silver/chrome) === */}
      {/* Base shadow ellipse */}
      <ellipse cx="32" cy="59" rx="15" ry="3" fill="#4B5563" fillOpacity="0.3" />
      {/* Base top surface */}
      <ellipse cx="32" cy="57" rx="14" ry="3.5" fill="url(#hpBase)" stroke="#6B7280" strokeWidth="0.8" />
      {/* Base rim ring */}
      <ellipse cx="32" cy="57" rx="11" ry="2.5" fill="none" stroke="#9CA3AF" strokeWidth="0.4" />
      <ellipse cx="32" cy="57" rx="8" ry="1.8" fill="none" stroke="#D1D5DB" strokeWidth="0.3" />

      {/* === SOUNDBOARD / RESONANCE BODY (right side, tapered) === */}
      <path
        d="M42 16C47 22 49 30 48 40C47 47 44 52 40 55C38 56 36.5 55.5 36 54C37 50 38.5 44 39 37C39.5 30 39 23 37 18C38.5 16 40.5 15.2 42 16Z"
        fill="url(#hpSoundboard)"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Soundboard front edge highlight */}
      <path
        d="M37.5 19C38 25 38.5 32 38 39C37.5 45 37 50.5 36.5 53"
        stroke="url(#hpSoundboardEdge)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* === HARMONIC CURVE / NECK (elegant S-curve at top) === */}
      <path
        d="M19 14C19 10 22 7 27 7C32 7.5 37 10 42 15C41.5 17 40 17.5 38.5 16.5C35 13.5 31 11.5 27.5 11C24.5 10.5 22.5 12 22 14.5C21.5 16 20.5 17.5 19 18L19 14Z"
        fill="url(#hpNeck)"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Neck top highlight arc */}
      <path
        d="M20 12C21.5 9 24.5 7.8 28 8.2C33 9 37.5 11.5 41 14.5"
        stroke="#FEF9C3"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />

      {/* === FRONT PILLAR / COLUMN (tall vertical piece on left) === */}
      <path
        d="M19 14C18 14 17 15 17 16.5C17 18 17.5 22 18 28C18.5 34 19 40 19.5 46C20 50 20.5 53 21.5 55C22.5 56.5 24 56 24.5 54.5C24 52 23.5 48 23 42C22.5 36 22 28 21.5 22C21.2 18 21 15.5 20.5 14.5C20 14 19.5 14 19 14Z"
        fill="url(#hpPillarHighlight)"
        stroke="#78350F"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Pillar center shine line */}
      <path
        d="M19.8 17C20 22 20.5 30 21 38C21.5 44 22 50 22.5 53.5"
        stroke="#FEF9C3"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      {/* === SCROLL / CROWN at top of pillar === */}
      <circle cx="19" cy="13" r="2.5" fill="url(#hpNeck)" stroke="#78350F" strokeWidth="1" />
      <circle cx="19" cy="13" r="1" fill="#FEF3C7" />

      {/* === TUNING PEGS along the neck === */}
      <circle cx="24.5" cy="10.5" r="0.7" fill="#5B210B" />
      <circle cx="27.5" cy="9.8" r="0.7" fill="#5B210B" />
      <circle cx="30.5" cy="10" r="0.7" fill="#5B210B" />
      <circle cx="33" cy="11" r="0.7" fill="#5B210B" />
      <circle cx="35.5" cy="12.5" r="0.7" fill="#5B210B" />
      <circle cx="37.5" cy="14.2" r="0.7" fill="#5B210B" />
      <circle cx="39.5" cy="16" r="0.7" fill="#5B210B" />

      {/* === STRINGS (7 golden strings from neck to soundboard) === */}
      <g stroke="url(#hpString)" strokeLinecap="round">
        <line x1="24.5" y1="11" x2="26" y2="54" strokeWidth="0.9" />
        <line x1="27.5" y1="10.2" x2="28.5" y2="53.5" strokeWidth="0.9" />
        <line x1="30.5" y1="10.5" x2="31" y2="52.5" strokeWidth="0.85" />
        <line x1="33" y1="11.5" x2="33.5" y2="51" strokeWidth="0.8" />
        <line x1="35.5" y1="13" x2="35.8" y2="48.5" strokeWidth="0.75" />
        <line x1="37.5" y1="14.8" x2="37.5" y2="44" strokeWidth="0.7" />
        <line x1="39.5" y1="16.5" x2="39" y2="39" strokeWidth="0.65" />
      </g>

      {/* === BRIDGE POINTS on soundboard === */}
      <g fill="#FDE68A" stroke="#92400E" strokeWidth="0.4">
        <circle cx="26" cy="54" r="0.6" />
        <circle cx="28.5" cy="53.5" r="0.6" />
        <circle cx="31" cy="52.5" r="0.6" />
        <circle cx="33.5" cy="51" r="0.6" />
        <circle cx="35.8" cy="48.5" r="0.6" />
        <circle cx="37.5" cy="44" r="0.5" />
        <circle cx="39" cy="39" r="0.5" />
      </g>

      {/* === Foot connecting pillar to base === */}
      <path
        d="M21 55C22 56.5 26 57.5 32 57.5C38 57.5 41 56.5 42 55"
        stroke="#92400E"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22 55.5C25 56.5 28.5 57 32 57C35.5 57 39 56.5 41 55.5"
        fill="url(#hpGoldBody)"
        stroke="#78350F"
        strokeWidth="0.6"
      />
    </svg>
  )
}
