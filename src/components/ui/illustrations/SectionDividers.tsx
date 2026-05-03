import React from 'react'

export function SoftWaveDivider({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${className}`} style={{ transform: flip ? 'scaleY(-1)' : 'none' }}>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-auto block" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 0 L 0 30 Q 360 80 720 50 Q 1080 20 1440 60 L 1440 0 Z" fill="#1A0A1E" />
      </svg>
    </div>
  )
}

export function BlushCurveDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${className}`}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-auto block" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0 0 L 1440 0 L 1440 20 Q 1080 60 720 40 Q 360 20 0 50 Z" fill="#FDF6F9" />
      </svg>
    </div>
  )
}

export function GoldSparkleLine({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 200 20" width="200" height="20" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="10" x2="80" y2="10" stroke="#C9A84C" strokeWidth="0.75" />
        <text x="90" y="14" fill="#C9A84C" fontSize="6" fontFamily="serif">&#9670;</text>
        <line x1="100" y1="10" x2="200" y2="10" stroke="#C9A84C" strokeWidth="0.75" />
      </svg>
    </div>
  )
}