import React from 'react'

export function HeroCalloutCardA({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_8px_32px_rgba(139,58,143,0.12)] border-l-[3px] border-l-[#8B3A8F] relative ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M8 14C8 14 3 11 3 7C3 5 4.5 3 6 3C7 3 8 4 8 4C8 4 9 3 10 3C11.5 3 13 5 13 7C13 11 8 14 8 14Z" fill="#8B3A8F" opacity="0.8"/>
        <path d="M6 7L7.5 8.5L10 6" stroke="#8B3A8F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-[#6B6B6B] leading-tight">Natural</span>
        <span className="text-[13px] font-bold text-[#1C1C1C] leading-tight">Ingredients</span>
      </div>
      <span className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-[#C9A84C]" />
    </div>
  )
}

export function HeroCalloutCardB({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B3A8F] to-[#7A3380] px-4 py-2.5 shadow-[0_8px_24px_rgba(139,58,143,0.3)] ${className}`}
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
      className={`inline-flex items-center rounded-full border-[1.5px] border-[#C9A84C] bg-white px-4 py-2 shadow-[0_0_16px_rgba(201,168,76,0.2)] ${className}`}
    >
      <span className="text-sm font-semibold text-[#C9A84C]">रू 1,299</span>
    </div>
  )
}