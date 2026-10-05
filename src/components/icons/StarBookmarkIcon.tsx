import React from 'react'

export const StarBookmarkIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-20' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sombra Suave de Fundo */}
      <polygon
        points="32,8 40,24 58,25 44,37 48,55 32,44 16,55 20,37 6,25 24,24"
        fill="#000000"
        fillOpacity="0.25"
      />

      {/* Corpo Dourado Principal */}
      <polygon
        points="32,6 40,23 58,24 44,36 48,54 32,43 16,54 20,36 6,24 24,23"
        fill="#eab308"
        stroke="#92400e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Facetas de Relevo e Luz 3D Dourado */}
      {/* Ponta superior esquerda: luz intensa */}
      <polygon points="32,6 32,43 24,23" fill="#fef08a" />
      {/* Ponta superior direita: luz dourada */}
      <polygon points="32,6 32,43 40,23" fill="#facc15" />
      {/* Braço direito: ouro médio */}
      <polygon points="58,24 32,43 40,23" fill="#fbbf24" />
      {/* Braço direito inferior: sombra quente */}
      <polygon points="58,24 32,43 44,36" fill="#f59e0b" />
      {/* Ponta inferior direita: sombra */}
      <polygon points="48,54 32,43 44,36" fill="#d97706" />
      {/* Ponta inferior esquerda: sombra profunda */}
      <polygon points="16,54 32,43 48,54" fill="#b45309" />
      {/* Braço esquerdo inferior: sombra */}
      <polygon points="16,54 32,43 20,36" fill="#b45309" />
      {/* Braço esquerdo superior: sombra média */}
      <polygon points="6,24 32,43 20,36" fill="#ca8a04" />
      {/* Ponta esquerda topo: ouro quente */}
      <polygon points="6,24 32,43 24,23" fill="#eab308" />

      {/* Arestas de brilho e divisão 3D */}
      <line x1="32" y1="6" x2="32" y2="43" stroke="#fffbeb" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="58" y1="24" x2="32" y2="43" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
      <line x1="48" y1="54" x2="32" y2="43" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="54" x2="32" y2="43" stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
      <line x1="6" y1="24" x2="32" y2="43" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
