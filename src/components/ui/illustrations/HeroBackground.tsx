import React from 'react'

export function HeroBackground({ className = '', mobile = false }: { className?: string; mobile?: boolean }) {
  if (mobile) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 390 750"
        className={className}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="heroBgM" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FEFCFB" />
            <stop offset="50%" stopColor="#FFE4E9" />
            <stop offset="100%" stopColor="#FEFCFB" />
          </linearGradient>
          <radialGradient id="blobRightM" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F2D4DA" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F2D4DA" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blobLeftM" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D4798A" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#D4798A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pearlGradM" cx="0.35" cy="0.35" r="0.65">
            <stop offset="0%" stopColor="#FEFCFB" />
            <stop offset="50%" stopColor="#F2D4DA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F2D4DA" stopOpacity="0" />
          </radialGradient>
          <filter id="grainM">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <filter id="blur120M">
            <feGaussianBlur stdDeviation="100" />
          </filter>
          <filter id="blur80M">
            <feGaussianBlur stdDeviation="60" />
          </filter>
        </defs>
        <rect width="390" height="750" fill="url(#heroBgM)" />
        <ellipse cx="390" cy="50" rx="350" ry="350" fill="url(#blobRightM)" filter="url(#blur120M)" />
        <ellipse cx="-40" cy="650" rx="250" ry="250" fill="url(#blobLeftM)" filter="url(#blur80M)" />
        <g opacity="0.15" fill="none" stroke="#B8860B" strokeWidth="0.75">
          <path d="M 340 80 A 50 50 0 1 1 340 130" />
          <path d="M 340 40 A 90 90 0 1 1 340 220" />
          <path d="M 340 0 A 130 130 0 1 1 340 310" />
        </g>
        <g fill="#D4798A">
          <path d="M 80 50 Q 95 25 110 50 Q 95 75 80 50 Z" opacity="0.10" />
          <path d="M 220 30 Q 238 0 256 30 Q 238 60 220 30 Z" opacity="0.08" />
          <path d="M 50 120 Q 70 95 90 120 Q 70 145 50 120 Z" opacity="0.12" />
        </g>
        <line x1="20" y1="375" x2="70" y2="375" stroke="#B8860B" strokeWidth="1" />
        <text x="78" y="379" fill="#B8860B" fontSize="7" fontFamily="serif">&#9670;</text>
        <circle cx="280" cy="350" r="6" fill="url(#pearlGradM)" />
        <circle cx="320" cy="250" r="8" fill="url(#pearlGradM)" />
        <circle cx="200" cy="420" r="5" fill="url(#pearlGradM)" />
        <circle cx="150" cy="300" r="7" fill="url(#pearlGradM)" />
        <circle cx="260" cy="500" r="6" fill="url(#pearlGradM)" />
        <rect width="390" height="750" filter="url(#grainM)" opacity="0.03" />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 760"
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEFCFB" />
          <stop offset="50%" stopColor="#FFE4E9" />
          <stop offset="100%" stopColor="#FEFCFB" />
        </linearGradient>
        <radialGradient id="blobRight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F2D4DA" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#F2D4DA" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="blobLeft" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#D4798A" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#D4798A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pearlGrad" cx="0.35" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#FEFCFB" />
          <stop offset="50%" stopColor="#F2D4DA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F2D4DA" stopOpacity="0" />
        </radialGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <filter id="blur120">
          <feGaussianBlur stdDeviation="120" />
        </filter>
        <filter id="blur80">
          <feGaussianBlur stdDeviation="80" />
        </filter>
      </defs>
      <rect width="1440" height="760" fill="url(#heroBg)" />
      <ellipse cx="1540" cy="-50" rx="600" ry="600" fill="url(#blobRight)" filter="url(#blur120)" />
      <ellipse cx="-80" cy="710" rx="400" ry="400" fill="url(#blobLeft)" filter="url(#blur80)" />
      <g opacity="0.2" fill="none" stroke="#B8860B" strokeWidth="0.75">
        <path d="M 1200 200 A 80 80 0 1 1 1200 280" />
        <path d="M 1200 140 A 140 140 0 1 1 1200 340" />
        <path d="M 1200 80 A 200 200 0 1 1 1200 400" />
      </g>
      <g fill="#D4798A">
        <path d="M 320 95 Q 335 70 350 95 Q 335 120 320 95 Z" opacity="0.10" />
        <path d="M 580 55 Q 598 25 616 55 Q 598 85 580 55 Z" opacity="0.08" />
        <path d="M 180 180 Q 200 155 220 180 Q 200 205 180 180 Z" opacity="0.12" />
        <path d="M 750 130 Q 768 100 786 130 Q 768 160 750 130 Z" opacity="0.09" />
      </g>
      <line x1="40" y1="380" x2="100" y2="380" stroke="#B8860B" strokeWidth="1" />
      <text x="108" y="384" fill="#B8860B" fontSize="8" fontFamily="serif">&#9670;</text>
      <circle cx="920" cy="280" r="8" fill="url(#pearlGrad)" />
      <circle cx="1050" cy="350" r="12" fill="url(#pearlGrad)" />
      <circle cx="780" cy="420" r="6" fill="url(#pearlGrad)" />
      <circle cx="1100" cy="220" r="10" fill="url(#pearlGrad)" />
      <circle cx="650" cy="320" r="7" fill="url(#pearlGrad)" />
      <circle cx="850" cy="180" r="9" fill="url(#pearlGrad)" />
      <circle cx="970" cy="450" r="8" fill="url(#pearlGrad)" />
      <rect width="1440" height="760" filter="url(#grain)" opacity="0.03" />
    </svg>
  )
}