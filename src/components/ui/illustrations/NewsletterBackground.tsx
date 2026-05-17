import React from 'react'

export function NewsletterDark({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="nlGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D97898" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#D97898" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="400" fill="#1A0A1E" />
        <ellipse cx="720" cy="200" rx="600" ry="300" fill="url(#nlGlow)" />
        {/* Constellation dots */}
        <g fill="white" opacity="0.15">
          <circle cx="180" cy="80" r="1.5" /><circle cx="340" cy="160" r="1" />
          <circle cx="520" cy="60" r="2" /><circle cx="680" cy="120" r="1.5" />
          <circle cx="800" cy="280" r="1" /><circle cx="960" cy="90" r="2" />
          <circle cx="1100" cy="200" r="1.5" /><circle cx="1250" cy="140" r="1" />
          <circle cx="1320" cy="300" r="1.5" /><circle cx="250" cy="280" r="1" />
          <circle cx="450" cy="320" r="1.5" /><circle cx="600" cy="350" r="1" />
          <circle cx="880" cy="50" r="1.5" /><circle cx="1050" cy="340" r="1" />
          <circle cx="150" cy="200" r="1" /><circle cx="400" cy="240" r="2" />
          <circle cx="750" cy="180" r="1" /><circle cx="950" cy="250" r="1.5" />
          <circle cx="1200" cy="80" r="1" /><circle cx="300" cy="350" r="1.5" />
          <circle cx="550" cy="140" r="1" /><circle cx="700" cy="300" r="1" />
          <circle cx="1150" cy="280" r="1.5" /><circle cx="100" cy="340" r="1" />
          <circle cx="630" cy="90" r="1.5" /><circle cx="850" cy="160" r="1" />
          <circle cx="1300" cy="180" r="2" /><circle cx="200" cy="130" r="1" />
          <circle cx="500" cy="260" r="1.5" /><circle cx="1050" cy="60" r="1" />
        </g>
        {/* Gold corner accents */}
        <g stroke="#C9A84C" strokeWidth="1" opacity="0.4">
          <line x1="40" y1="40" x2="120" y2="40" />
          <line x1="40" y1="40" x2="40" y2="120" />
          <line x1="1400" y1="360" x2="1320" y2="360" />
          <line x1="1400" y1="360" x2="1400" y2="280" />
        </g>
        {/* GLAMO watermark */}
        <text x="720" y="220" textAnchor="middle" fontFamily="Outfit, sans-serif" fontSize="160" fontWeight="700" fill="white" opacity="0.03" letterSpacing="40">GLAMO</text>
        {/* Sparkling dots with animation */}
        <g fill="white">
          <circle cx="350" cy="100" r="2" opacity="0.3"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="900" cy="80" r="1.5" opacity="0.2"><animate attributeName="opacity" values="0.1;0.35;0.1" dur="2.5s" repeatCount="indefinite" /></circle>
          <circle cx="600" cy="300" r="2" opacity="0.25"><animate attributeName="opacity" values="0.1;0.45;0.1" dur="1.8s" repeatCount="indefinite" /></circle>
          <circle cx="1100" cy="250" r="1.5" opacity="0.2"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" /></circle>
          <circle cx="200" cy="220" r="2" opacity="0.15"><animate attributeName="opacity" values="0.1;0.4;0.1" dur="2.2s" repeatCount="indefinite" /></circle>
          <circle cx="1250" cy="120" r="1.5" opacity="0.2"><animate attributeName="opacity" values="0.1;0.35;0.1" dur="2.8s" repeatCount="indefinite" /></circle>
          <circle cx="750" cy="340" r="2" opacity="0.25"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="480" cy="160" r="1.5" opacity="0.15"><animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.6s" repeatCount="indefinite" /></circle>
        </g>
      </svg>
    </div>
  )
}

export function NewsletterLight({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nlLightBg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FDF6F9" />
            <stop offset="50%" stopColor="#FDECEF" />
            <stop offset="100%" stopColor="#FDF6F9" />
          </linearGradient>
          <radialGradient id="nlBlob" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D4A0D7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A0D7" stopOpacity="0" />
          </radialGradient>
          <filter id="nlBlur">
            <feGaussianBlur stdDeviation="100" />
          </filter>
        </defs>
        <rect width="1440" height="400" fill="url(#nlLightBg)" />
        <ellipse cx="1000" cy="200" rx="500" ry="300" fill="url(#nlBlob)" filter="url(#nlBlur)" />
        {/* Botanical line art */}
        <g fill="none" stroke="#D97898" strokeWidth="0.8" opacity="0.06">
          <path d="M 80 320 Q 95 300 110 320 Q 95 340 80 320 Z" />
          <path d="M 200 280 Q 218 255 236 280 Q 218 305 200 280 Z" />
          <path d="M 120 180 Q 135 160 150 180 Q 135 200 120 180 Z" />
          <line x1="80" y1="320" x2="95" y2="300" strokeWidth="0.5" />
          <path d="M 1300 100 Q 1315 80 1330 100 Q 1315 120 1300 100 Z" />
          <path d="M 1200 250 Q 1218 225 1236 250 Q 1218 275 1200 250 Z" />
          <path d="M 1350 300 Q 1365 280 1380 300 Q 1365 320 1350 300 Z" />
          <line x1="1300" y1="100" x2="1315" y2="80" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  )
}