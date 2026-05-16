import React from 'react'

export function NotFoundIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      className={`w-full max-w-[480px] ${className}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pouchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4798A" />
          <stop offset="100%" stopColor="#6B2A6F" />
        </linearGradient>
        <linearGradient id="mirrorGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8D5EA" />
          <stop offset="100%" stopColor="#F2D4DA" />
        </linearGradient>
        <radialGradient id="sparkle" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#B8860B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B8860B" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Cosmetic pouch */}
      <path d="M 160 280 Q 160 160 180 140 L 280 140 Q 300 160 300 280 Q 300 310 230 320 Q 160 310 160 280 Z" fill="url(#pouchGrad)" />
      <path d="M 180 140 Q 230 120 280 140" fill="#AD4B64" stroke="#E496AF" strokeWidth="0.5" />
      <ellipse cx="230" cy="145" rx="12" ry="5" fill="#B8860B" opacity="0.7" />
      {/* Tall bottle */}
      <g transform="translate(80, 160) rotate(-15)">
        <rect x="0" y="0" width="22" height="70" rx="3" fill="#F2D4DA" opacity="0.7" />
        <rect x="6" y="-10" width="10" height="14" rx="2" fill="#F2D4DA" opacity="0.8" />
        <rect x="3" y="10" width="16" height="3" rx="1" fill="#B8860B" opacity="0.5" />
      </g>
      {/* Round jar */}
      <g transform="translate(120, 200)">
        <ellipse cx="20" cy="40" rx="25" ry="8" fill="#B8D4C8" opacity="0.4" />
        <rect x="-5" y="10" width="50" height="30" rx="8" fill="#B8D4C8" opacity="0.6" />
        <ellipse cx="20" cy="10" rx="25" ry="8" fill="#C8E4D8" opacity="0.7" />
      </g>
      {/* Hand mirror */}
      <g transform="translate(300, 100) rotate(20)">
        <rect x="28" y="70" width="8" height="40" rx="4" fill="#B8860B" opacity="0.8" />
        <ellipse cx="32" cy="45" rx="35" ry="40" fill="url(#mirrorGrad)" stroke="#B8860B" strokeWidth="1.5" />
        <text x="32" y="50" textAnchor="middle" fontFamily="Prata, Georgia, serif" fontSize="22" fontWeight="700" fontStyle="italic" fill="#D4798A" opacity="0.8">404</text>
      </g>
      {/* Makeup puff */}
      <g transform="translate(100, 260)">
        <ellipse cx="25" cy="15" rx="25" ry="18" fill="#F7C5C0" opacity="0.7" />
        <ellipse cx="25" cy="10" rx="20" ry="12" fill="#F7C5C0" opacity="0.5" />
      </g>
      {/* Lipstick */}
      <g transform="translate(140, 230) rotate(-25)">
        <rect x="0" y="0" width="14" height="50" rx="2" fill="#D4798A" opacity="0.6" />
        <path d="M 2 0 Q 7 -15 12 0" fill="#B8860B" opacity="0.7" />
      </g>
      {/* Sparkle dots */}
      <circle cx="350" cy="60" r="3" fill="url(#sparkle)" />
      <circle cx="80" cy="120" r="2" fill="url(#sparkle)" />
      <circle cx="400" cy="180" r="2.5" fill="url(#sparkle)" />
      <circle cx="60" cy="300" r="2" fill="url(#sparkle)" />
      <circle cx="420" cy="280" r="3" fill="url(#sparkle)" />
      <circle cx="250" cy="50" r="2" fill="url(#sparkle)" />
      <circle cx="380" cy="330" r="2.5" fill="url(#sparkle)" />
      {/* Sparkle crosses */}
      <g stroke="#B8860B" strokeWidth="1" opacity="0.5">
        <line x1="440" y1="100" x2="448" y2="100" />
        <line x1="444" y1="96" x2="444" y2="104" />
        <line x1="50" y1="180" x2="58" y2="180" />
        <line x1="54" y1="176" x2="54" y2="184" />
      </g>
    </svg>
  )
}