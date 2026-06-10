import React from 'react'

export function HeroCalloutCardA({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-accent-soft border-l-[3px] border-l-brand-primary relative ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 14C8 14 3 11 3 7C3 5 4.5 3 6 3C7 3 8 4 8 4C8 4 9 3 10 3C11.5 3 13 5 13 7C13 11 8 14 8 14Z" fill="#D97898" opacity="0.8"/>
        <path d="M6 7L7.5 8.5L10 6" stroke="#D97898" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-neutral-500 leading-tight">Natural</span>
        <span className="text-[13px] font-bold text-neutral-900 leading-tight">Ingredients</span>
      </div>
      <span className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-brand-gold" />
    </div>
  )
}

export function HeroCalloutCardB({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-800 px-4 py-2.5 shadow-accent-medium ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M7 2L8.5 5.5L12 6L9.5 8.5L10 12L7 10.5L4 12L4.5 8.5L2 6L5.5 5.5L7 2Z" fill="#C9A84C"/>
      </svg>
      <span className="text-base font-bold text-white leading-none">4.9</span>
      <span className="text-[10px] text-white/80 leading-none">1,200+ reviews</span>
    </div>
  )
}

export function HeroCalloutCardC({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center rounded-full border-[1.5px] border-brand-gold bg-white px-4 py-2 shadow-gold-glow ${className}`}
    >
      <span className="text-sm font-semibold text-brand-gold">रू 1,299</span>
    </div>
  )
}