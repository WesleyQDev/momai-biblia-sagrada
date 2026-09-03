import React from 'react'

export const BibleExtensionIcon: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <defs>
        <linearGradient id="extBackCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#144b8a" />
          <stop offset="60%" stopColor="#0f3c73" />
          <stop offset="100%" stopColor="#082347" />
        </linearGradient>

        <linearGradient id="extSpineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f3c73" />
          <stop offset="70%" stopColor="#1959a6" />
          <stop offset="100%" stopColor="#0d3566" />
        </linearGradient>

        <linearGradient id="extFrontCoverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#166fe5" />
          <stop offset="40%" stopColor="#2382f7" />
          <stop offset="85%" stopColor="#1a73e8" />
          <stop offset="100%" stopColor="#125dc2" />
        </linearGradient>

        <linearGradient id="extFrontGlossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="15%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="extPagesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a5568" />
          <stop offset="12%" stopColor="#8a95a5" />
          <stop offset="25%" stopColor="#d9e0e8" />
          <stop offset="48%" stopColor="#f4f7fa" />
          <stop offset="70%" stopColor="#cbd3dc" />
          <stop offset="90%" stopColor="#9aa5b5" />
          <stop offset="100%" stopColor="#5a6575" />
        </linearGradient>

        <linearGradient id="extPagesShadowH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a2533" stopOpacity="0.9" />
          <stop offset="8%" stopColor="#2c3e50" stopOpacity="0.5" />
          <stop offset="15%" stopColor="#2c3e50" stopOpacity="0.05" />
          <stop offset="85%" stopColor="#2c3e50" stopOpacity="0.05" />
          <stop offset="95%" stopColor="#1a2533" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0e1722" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id="extRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#125ec7" />
          <stop offset="40%" stopColor="#1b6edc" />
          <stop offset="85%" stopColor="#0b3875" />
          <stop offset="100%" stopColor="#061d3d" />
        </linearGradient>

        <linearGradient id="extRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10447f" />
          <stop offset="40%" stopColor="#2b75cb" />
          <stop offset="100%" stopColor="#124887" />
        </linearGradient>

        <filter id="extCoverShadow" x="-10%" y="-10%" width="130%" height="150%">
          <feDropShadow dx="0" dy="16" stdDeviation="10" floodColor="#031024" floodOpacity="0.75" />
        </filter>

        <filter id="extTextGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#082b59" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect x="16" y="16" width="480" height="480" rx="90" fill="url(#extBackCoverGrad)" />

      <path
        d="M 40 405 C 50 380, 75 375, 110 375 L 420 375 C 460 375, 480 395, 480 425 C 475 460, 440 472, 395 472 L 100 472 C 55 472, 35 440, 40 405 Z"
        fill="url(#extPagesGrad)"
      />
      <path
        d="M 40 405 C 50 380, 75 375, 110 375 L 420 375 C 460 375, 480 395, 480 425 C 475 460, 440 472, 395 472 L 100 472 C 55 472, 35 440, 40 405 Z"
        fill="url(#extPagesShadowH)"
      />

      <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round">
        <line x1="85" y1="412" x2="445" y2="412" />
        <line x1="75" y1="422" x2="455" y2="422" />
        <line x1="70" y1="432" x2="450" y2="432" />
        <line x1="75" y1="442" x2="435" y2="442" />
        <line x1="90" y1="452" x2="410" y2="452" />
        <line x1="110" y1="462" x2="380" y2="462" />
      </g>

      <path d="M 118 410 L 118 468 L 138 456 L 158 468 L 158 410 Z" fill="url(#extRibbonGrad)" />

      <path
        d="M 16 430 C 16 470, 45 496, 95 496 L 420 496 C 465 496, 492 470, 492 435 C 492 455, 465 486, 415 486 L 95 486 C 45 486, 26 455, 22 430 Z"
        fill="url(#extRimGrad)"
      />
      <path d="M 95 486 L 415 486" stroke="#4897f7" strokeWidth="2" opacity="0.6" />

      <g filter="url(#extCoverShadow)">
        <path
          d="M 16 106 C 16 56, 56 16, 106 16 L 406 16 C 456 16, 496 56, 496 106 L 496 345 C 475 385, 445 395, 410 395 L 95 395 C 40 395, 20 415, 16 430 Z"
          fill="url(#extFrontCoverGrad)"
        />
      </g>

      <path
        d="M 16 106 C 16 56, 56 16, 106 16 L 105 16 L 105 395 C 50 395, 22 415, 16 430 Z"
        fill="url(#extSpineGrad)"
      />
      <line x1="105" y1="16" x2="105" y2="395" stroke="#0e3463" strokeWidth="2" opacity="0.5" />
      <line x1="107" y1="16" x2="107" y2="395" stroke="#4395fb" strokeWidth="1.5" opacity="0.4" />

      <path
        d="M 16 106 C 16 56, 56 16, 106 16 L 406 16 C 456 16, 496 56, 496 106 L 496 220 C 360 170, 150 170, 16 220 Z"
        fill="url(#extFrontGlossGrad)"
      />

      <path
        d="M 16 430 C 20 415, 40 395, 95 395 L 410 395 C 445 395, 475 385, 496 345"
        fill="none"
        stroke="#68adff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      <text
        x="300"
        y="235"
        fontFamily="'Georgia', 'Times New Roman', 'Baskerville', serif"
        fontSize="94"
        fontWeight="bold"
        letterSpacing="1"
        fill="#ffffff"
        textAnchor="middle"
        filter="url(#extTextGlow)"
      >
        Bíblia
      </text>
    </svg>
  )
}
