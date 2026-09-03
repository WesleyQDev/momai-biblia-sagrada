import React from 'react'

export const WheatIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={className}
    >
      <defs>
        {/* Grão base individual */}
        <path id="wheat_grain" d="M 0 0 C -9 -14 -11 -28 0 -42 C 11 -28 9 -14 0 0 Z" />

        {/* Par de grãos simétricos */}
        <g id="wheat_grain_pair">
          <use href="#wheat_grain" transform="translate(-5, -3) rotate(-38) scale(0.9, 0.95)" />
          <use href="#wheat_grain" transform="translate(5, -3) scale(-1, 1) rotate(-38) scale(0.9, 0.95)" />
        </g>

        {/* Par com aristas longas (topo da espiga) */}
        <g id="wheat_grain_pair_awns">
          <use href="#wheat_grain" transform="translate(-4, -2) rotate(-30) scale(0.72, 0.8)" />
          <use href="#wheat_grain" transform="translate(4, -2) scale(-1, 1) rotate(-30) scale(0.72, 0.8)" />
          {/* Aristas finas e pontiagudas */}
          <path d="M -7 -20 C -12 -70 -16 -120 -18 -150 C -16 -120 -10 -70 -5 -20 Z" />
          <path d="M 7 -20 C 12 -70 16 -120 18 -150 C 16 -120 10 -70 5 -20 Z" />
          <path d="M 0 -26 C -4 -85 -3 -140 0 -175 C 3 -140 4 -85 0 -26 Z" />
        </g>

        {/* Espiga completa */}
        <g id="wheat_head">
          <use href="#wheat_grain_pair_awns" transform="translate(0, -180)" />
          <use href="#wheat_grain_pair" transform="translate(0, -162) scale(0.85)" />
          <use href="#wheat_grain_pair" transform="translate(0, -140) scale(0.98)" />
          <use href="#wheat_grain_pair" transform="translate(0, -116) scale(1.08)" />
          <use href="#wheat_grain_pair" transform="translate(0, -90) scale(1.15)" />
          <use href="#wheat_grain_pair" transform="translate(0, -62) scale(1.15)" />
          <use href="#wheat_grain_pair" transform="translate(0, -34) scale(1.08)" />
          <use href="#wheat_grain_pair" transform="translate(0, -8) scale(0.95)" />
        </g>
      </defs>

      <g fill="#F5B300" stroke="#F5B300" strokeLinejoin="round">
        {/* Ramo Central (reto e dominante) */}
        <g transform="translate(225, 345)">
          {/* Haste */}
          <path d="M -1.8 0 L -1.8 135 L 1.8 135 L 1.8 0 Z" strokeWidth="0.5" />
          <use href="#wheat_head" />
        </g>

        {/* Ramo Esquerdo (inclinado) */}
        <g transform="translate(178, 400) rotate(-16) scale(0.82)">
          {/* Haste curva afinando na base */}
          <path d="M -2.2 0 Q -0.5 80 34 100 Q 20 70 2.2 0 Z" />
          <use href="#wheat_head" />
        </g>

        {/* Ramo Direito (inclinado e menor) */}
        <g transform="translate(262, 425) rotate(32) scale(0.68)">
          {/* Haste curva afinando na base */}
          <path d="M -2.5 0 Q -2 60 -36 70 Q -20 45 2.5 0 Z" />
          <use href="#wheat_head" />
        </g>
      </g>
    </svg>
  )
}
