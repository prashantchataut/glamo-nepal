import React from 'react'

export function ProductCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      <div className="aspect-square w-full skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 rounded skeleton-shimmer" />
          <div className="h-8 w-8 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}

export function HeroSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full rounded-[1.5rem] overflow-hidden ${className}`}>
      <div className="w-full h-[400px] md:h-[600px] skeleton-hero-bg">
        <div className="p-8 md:p-16 space-y-4">
          <div className="h-3 w-20 rounded skeleton-shimmer" />
          <div className="h-10 w-3/4 rounded skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded skeleton-shimmer" />
          <div className="flex gap-3 pt-4">
            <div className="h-10 w-32 rounded-full skeleton-shimmer" />
            <div className="h-10 w-28 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}