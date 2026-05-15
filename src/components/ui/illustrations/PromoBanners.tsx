import React from 'react'

export function PromoBannerSummerGlow({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ aspectRatio: '680/420' }}>
      <svg viewBox="0 0 680 420" className="absolute inset-0 w-full h-full" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="promoDarkBg" cx="0.3" cy="0.5" r="0.8">
            <stop offset="0%" stopColor="#2D1040" />
            <stop offset="50%" stopColor="#1A0A1E" />
            <stop offset="100%" stopColor="#1A0A1E" />
          </radialGradient>
          <radialGradient id="promoGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#8B3A8F" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B3A8F" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="680" height="420" fill="url(#promoDarkBg)" />
        <ellipse cx="510" cy="210" rx="250" ry="250" fill="url(#promoGlow)" style={{ filter: 'blur(60px)' }} />
        <circle cx="520" cy="140" r="8" fill="#C9A84C" opacity="0.6" />
        <circle cx="580" cy="240" r="12" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.4" />
        <circle cx="480" cy="300" r="6" fill="#C9A84C" opacity="0.5" />
        <path d="M 420 80 A 200 200 0 0 1 620 380" fill="none" stroke="#C9A84C" strokeWidth="0.75" opacity="0.2" />
      </svg>
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-px w-5 bg-[#C9A84C]" />
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C9A84C] font-medium">Limited Time</span>
        </div>
        <p className="font-display italic text-white text-6xl md:text-8xl leading-none mb-2" style={{ fontFamily: 'Prata, Georgia, serif' }}>50%</p>
        <p className="text-[#D4A0D7] text-sm tracking-[0.15em] mb-2">OFF SELECTED ITEMS</p>
        <p className="text-[#6B6B6B] text-[13px] mb-6">Clean. Vegan. Powerful.</p>
        <a href="/shop" className="inline-flex items-center justify-center w-[140px] h-10 rounded-full border border-[#C9A84C] text-[#C9A84C] text-[13px] font-medium hover:bg-[#C9A84C] hover:text-[#1A0A1E] transition-colors">
          Shop Now →
        </a>
      </div>
    </div>
  )
}

export function PromoBannerNewArrivals({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ aspectRatio: '680/420' }}>
      <svg viewBox="0 0 680 420" className="absolute inset-0 w-full h-full" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="promoLightBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDF6F9" />
            <stop offset="50%" stopColor="#F5E6F5" />
            <stop offset="100%" stopColor="#FDF6F9" />
          </linearGradient>
          <radialGradient id="promoCircle" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#D4A0D7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A0D7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="680" height="420" fill="url(#promoLightBg)" />
        <circle cx="580" cy="100" r="150" fill="none" stroke="#8B3A8F" strokeWidth="0.75" opacity="0.08" />
        <circle cx="580" cy="100" r="100" fill="url(#promoCircle)" />
      </svg>
      <div className="absolute bottom-0 right-0 w-[200px] h-[150px] opacity-[0.08]" aria-hidden="true">
        <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 10 60 Q 25 20 40 60 Q 25 100 10 60 Z" fill="none" stroke="#8B3A8F" strokeWidth="0.8" />
          <path d="M 30 60 Q 45 15 60 60 Q 45 105 30 60 Z" fill="none" stroke="#8B3A8F" strokeWidth="0.8" />
          <path d="M 50 60 Q 65 25 80 60 Q 65 95 50 60 Z" fill="none" stroke="#8B3A8F" strokeWidth="0.8" />
          <circle cx="45" cy="60" r="6" fill="none" stroke="#8B3A8F" strokeWidth="0.6" />
          <circle cx="45" cy="60" r="3" fill="none" stroke="#8B3A8F" strokeWidth="0.4" />
        </svg>
      </div>
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B3A8F]" />
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#8B3A8F] font-medium">Just Arrived</span>
        </div>
        <p className="text-[#1C1C1C] text-4xl md:text-5xl leading-tight" style={{ fontFamily: 'Prata, Georgia, serif' }}>New Glow</p>
        <p className="text-[#8B3A8F] text-4xl md:text-5xl leading-tight italic" style={{ fontFamily: 'Prata, Georgia, serif' }}>Collection</p>
        <p className="text-[#6B6B6B] text-sm mt-2 mb-6">Discover our latest additions</p>
        <a href="/collections/new-arrivals" className="inline-flex items-center justify-center w-[140px] h-10 rounded-full bg-[#8B3A8F] text-white text-[13px] font-medium hover:bg-[#7A3380] transition-colors">
          Explore →
        </a>
      </div>
    </div>
  )
}