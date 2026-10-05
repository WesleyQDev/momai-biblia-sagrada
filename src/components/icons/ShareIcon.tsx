import React from 'react'

export const ShareIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5'
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="17" cy="5.5" r="2.5" />
    <circle cx="17" cy="18.5" r="2.5" />
    <path d="M8.2 10.8l6.6-4M8.2 13.2l6.6 4" />
  </svg>
)

export default ShareIcon
