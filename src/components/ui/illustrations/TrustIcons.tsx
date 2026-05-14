/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'

const icons: Record<string, { label: string; path: string }> = {
  'cruelty-free': {
    label: 'Cruelty Free',
    path: 'M 16 28 C 10 28 6 24 6 20 C 6 16 9 14 11 13 L 9 6 C 8.8 5.5 9.2 5 9.7 5.2 L 13 8 C 13.5 6.5 14.5 5.5 16 5.5 C 17.5 5.5 18.5 6.5 19 8 L 22.3 5.2 C 22.8 5 23.2 5.5 23 6 L 21 13 C 23 14 26 16 26 20 C 26 24 22 28 16 28 Z',
  },
  'dermatologist': {
    label: 'Dermatologist Tested',
    path: '',
  },
  'vegan': {
    label: 'Vegan Formula',
    path: '',
  },
  'authentic': {
    label: '100% Authentic',
    path: '',
  },
  'safe-skin': {
    label: 'Safe for All Skin',
    path: '',
  },
  'free-delivery': {
    label: 'Free Delivery',
    path: '',
  },
} as const

export type TrustIconName = keyof typeof icons

export function TrustIcon({ name, className = '', size = 32 }: { name: TrustIconName; className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      {name === 'cruelty-free' && (
        <>
          <path d="M 16 28 C 10 28 6 24 6 20 C 6 16 9 14 11 13 L 9 6 C 8.8 5.5 9.2 5 9.7 5.2 L 13 8 C 13.5 6.5 14.5 5.5 16 5.5 C 17.5 5.5 18.5 6.5 19 8 L 22.3 5.2 C 22.8 5 23.2 5.5 23 6 L 21 13 C 23 14 26 16 26 20 C 26 24 22 28 16 28 Z" strokeLinejoin="round" />
          <path d="M 12 19 C 12 19 10 17 8 18 C 6 19 7 22 12 22" strokeWidth="1.2" />
          <path d="M 20 19 C 20 19 22 17 24 18 C 26 19 25 22 20 22" strokeWidth="1.2" />
          <path d="M 16 24 L 14.5 22 M 16 24 L 17.5 22" strokeWidth="1" strokeLinecap="round" />
          <path d="M 4 8 Q 6 6 8 8 Q 6 9 4 8 Z" strokeWidth="1" strokeLinejoin="round" fill="none" />
        </>
      )}
      {name === 'dermatologist' && (
        <>
          <circle cx="14" cy="14" r="8" />
          <line x1="19.5" y1="19.5" x2="26" y2="26" strokeLinecap="round" />
          <path d="M 14 11.5 C 14 10 12 10 12 11.5 C 12 13 14 14.5 14 14.5 C 14 14.5 16 13 16 11.5 C 16 10 14 10 14 11.5 Z" strokeWidth="1" />
        </>
      )}
      {name === 'vegan' && (
        <>
          <path d="M 16 26 L 16 14" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 16 14 Q 10 8 8 14 Q 12 16 16 14 Z" strokeLinejoin="round" />
          <path d="M 16 14 Q 22 8 24 14 Q 20 16 16 14 Z" strokeLinejoin="round" />
          <path d="M 16 18 Q 12 14 10 18 Q 13 19 16 18 Z" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 16 18 Q 20 14 22 18 Q 19 19 16 18 Z" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M 16 22 Q 14 20 13 22 Q 14.5 23 16 22 Z" strokeWidth="1" strokeLinejoin="round" />
        </>
      )}
      {name === 'authentic' && (
        <>
          <path d="M 16 4 L 6 8 L 6 16 C 6 22 10 27 16 28 C 22 27 26 22 26 16 L 26 8 Z" strokeLinejoin="round" />
          <path d="M 12 16 L 15 19 L 21 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 16 8 L 17 9.5 L 16 11 L 15 9.5 Z" strokeWidth="0.8" />
        </>
      )}
      {name === 'safe-skin' && (
        <>
          <path d="M 16 6 Q 18 10 18 14 Q 18 16 16 16 Q 14 16 14 14 Q 14 10 16 6 Z" />
          <path d="M 8 20 Q 8 16 12 16 L 16 16" strokeLinecap="round" />
          <path d="M 24 20 Q 24 16 20 16 L 16 16" strokeLinecap="round" />
          <path d="M 8 20 Q 8 24 10 26" strokeLinecap="round" />
          <path d="M 24 20 Q 24 24 22 26" strokeLinecap="round" />
        </>
      )}
      {name === 'free-delivery' && (
        <>
          <rect x="7" y="12" width="18" height="14" rx="1.5" />
          <path d="M 7 12 L 16 8 L 25 12" strokeLinejoin="round" />
          <line x1="16" y1="8" x2="16" y2="12" strokeWidth="1" />
          <path d="M 14 19 C 14 17.5 16 16 16 16 C 16 16 18 17.5 18 19 C 18 20.5 16 21 16 21 C 16 21 14 20.5 14 19 Z" strokeWidth="1" />
          <circle cx="22" cy="6" r="3" strokeWidth="1" />
          <path d="M 22 3 L 22 6.5 L 20.5 5" strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

export function TrustIconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }} aria-hidden="true">
      <symbol id="icon-cruelty-free" viewBox="0 0 32 32">
        <path d="M 16 28 C 10 28 6 24 6 20 C 6 16 9 14 11 13 L 9 6 C 8.8 5.5 9.2 5 9.7 5.2 L 13 8 C 13.5 6.5 14.5 5.5 16 5.5 C 17.5 5.5 18.5 6.5 19 8 L 22.3 5.2 C 22.8 5 23.2 5.5 23 6 L 21 13 C 23 14 26 16 26 20 C 26 24 22 28 16 28 Z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M 12 19 C 12 19 10 17 8 18 C 6 19 7 22 12 22" fill="none" stroke="white" strokeWidth="1.2"/>
        <path d="M 20 19 C 20 19 22 17 24 18 C 26 19 25 22 20 22" fill="none" stroke="white" strokeWidth="1.2"/>
        <path d="M 16 24 L 14.5 22 M 16 24 L 17.5 22" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round"/>
        <path d="M 4 8 Q 6 6 8 8 Q 6 9 4 8 Z" fill="none" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
      </symbol>
      <symbol id="icon-dermatologist" viewBox="0 0 32 32">
        <circle cx="14" cy="14" r="8" fill="none" stroke="white" strokeWidth="1.5"/>
        <line x1="19.5" y1="19.5" x2="26" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 14 11.5 C 14 10 12 10 12 11.5 C 12 13 14 14.5 14 14.5 C 14 14.5 16 13 16 11.5 C 16 10 14 10 14 11.5 Z" fill="none" stroke="white" strokeWidth="1"/>
      </symbol>
      <symbol id="icon-vegan" viewBox="0 0 32 32">
        <path d="M 16 26 L 16 14" fill="none" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M 16 14 Q 10 8 8 14 Q 12 16 16 14 Z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M 16 14 Q 22 8 24 14 Q 20 16 16 14 Z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M 16 18 Q 12 14 10 18 Q 13 19 16 18 Z" fill="none" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M 16 18 Q 20 14 22 18 Q 19 19 16 18 Z" fill="none" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M 16 22 Q 14 20 13 22 Q 14.5 23 16 22 Z" fill="none" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
      </symbol>
      <symbol id="icon-authentic" viewBox="0 0 32 32">
        <path d="M 16 4 L 6 8 L 6 16 C 6 22 10 27 16 28 C 22 27 26 22 26 16 L 26 8 Z" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M 12 16 L 15 19 L 21 13" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 16 8 L 17 9.5 L 16 11 L 15 9.5 Z" fill="none" stroke="white" strokeWidth="0.8"/>
      </symbol>
      <symbol id="icon-safe-skin" viewBox="0 0 32 32">
        <path d="M 16 6 Q 18 10 18 14 Q 18 16 16 16 Q 14 16 14 14 Q 14 10 16 6 Z" fill="none" stroke="white" strokeWidth="1.5"/>
        <path d="M 8 20 Q 8 16 12 16 L 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 24 20 Q 24 16 20 16 L 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 8 20 Q 8 24 10 26" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M 24 20 Q 24 24 22 26" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </symbol>
      <symbol id="icon-free-delivery" viewBox="0 0 32 32">
        <rect x="7" y="12" width="18" height="14" rx="1.5" fill="none" stroke="white" strokeWidth="1.5"/>
        <path d="M 7 12 L 16 8 L 25 12" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        <line x1="16" y1="8" x2="16" y2="12" stroke="white" strokeWidth="1"/>
        <path d="M 14 19 C 14 17.5 16 16 16 16 C 16 16 18 17.5 18 19 C 18 20.5 16 21 16 21 C 16 21 14 20.5 14 19 Z" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="22" cy="6" r="3" fill="none" stroke="white" strokeWidth="1"/>
        <path d="M 22 3 L 22 6.5 L 20.5 5" fill="none" stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
      </symbol>
    </svg>
  )
}

export function SpriteTrustIcon({ name, size = 32 }: { name: TrustIconName; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true" className="inline-block">
      <use href={`#icon-${name}`} />
    </svg>
  )
}