import React from 'react'

export function PhilosophyBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="philBg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F7EDF8" />
            <stop offset="50%" stopColor="#FDF6F9" />
            <stop offset="100%" stopColor="#F7EDF8" />
          </linearGradient>
          <radialGradient id="philGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D4A0D7" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#D4A0D7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="400" fill="url(#philBg)" />
        <ellipse cx="720" cy="200" rx="300" ry="300" fill="url(#philGlow)" />
        {/* Left botanical */}
        <g transform="translate(-60, 50)" opacity="0.08" fill="none" stroke="#8B3A8F" strokeWidth="1.2">
          <path d="M 150 200 Q 130 140 150 80 Q 170 140 150 200 Z" />
          <path d="M 150 200 Q 90 160 50 110 Q 110 150 150 200 Z" />
          <path d="M 150 200 Q 80 200 20 200 Q 80 200 150 200 Z" />
          <path d="M 150 200 Q 90 240 50 290 Q 110 250 150 200 Z" />
          <path d="M 150 200 Q 130 260 150 320 Q 170 260 150 200 Z" />
          <path d="M 150 200 Q 210 240 250 290 Q 190 250 150 200 Z" />
          <path d="M 150 200 Q 210 200 280 200 Q 210 200 150 200 Z" />
          <path d="M 150 200 Q 210 160 250 110 Q 190 150 150 200 Z" />
          <circle cx="150" cy="200" r="15" strokeWidth="0.8" />
          <circle cx="150" cy="200" r="8" strokeWidth="0.5" />
        </g>
        {/* Right botanical (mirror) */}
        <g transform="translate(1290, 50) scale(-1,1) translate(-300,0)" opacity="0.08" fill="none" stroke="#8B3A8F" strokeWidth="1.2">
          <path d="M 150 200 Q 130 140 150 80 Q 170 140 150 200 Z" />
          <path d="M 150 200 Q 90 160 50 110 Q 110 150 150 200 Z" />
          <path d="M 150 200 Q 80 200 20 200 Q 80 200 150 200 Z" />
          <path d="M 150 200 Q 90 240 50 290 Q 110 250 150 200 Z" />
          <path d="M 150 200 Q 130 260 150 320 Q 170 260 150 200 Z" />
          <path d="M 150 200 Q 210 240 250 290 Q 190 250 150 200 Z" />
          <path d="M 150 200 Q 210 200 280 200 Q 210 200 150 200 Z" />
          <path d="M 150 200 Q 210 160 250 110 Q 190 150 150 200 Z" />
          <circle cx="150" cy="200" r="15" strokeWidth="0.8" />
          <circle cx="150" cy="200" r="8" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  )
}