import React from 'react'

export function ProductCardBg({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cardPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.2" fill="#D97898" opacity="0.03" />
            <circle cx="5" cy="5" r="0.8" fill="#D97898" opacity="0.02" />
            <circle cx="35" cy="35" r="0.8" fill="#D97898" opacity="0.02" />
            <path d="M 10 30 Q 12 28 14 30 Q 12 32 10 30 Z" fill="#D97898" opacity="0.015" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="#FDF6F9" />
        <rect width="400" height="400" fill="url(#cardPattern)" />
      </svg>
    </div>
  )
}

export function ProductCardBgHover({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${className}`} aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(217,120,152,0.06)] to-transparent" />
    </div>
  )
}