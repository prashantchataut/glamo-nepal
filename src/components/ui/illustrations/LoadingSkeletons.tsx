import React from 'react'

export function ProductCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      <div
        className="aspect-square w-full"
        style={{
          background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
      />
      <div className="p-4 space-y-3">
        <div
          className="h-3 w-16 rounded"
          style={{
            background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <div
          className="h-4 w-3/4 rounded"
          style={{
            background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <div
          className="h-3 w-1/2 rounded"
          style={{
            background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <div className="flex items-center justify-between pt-2">
          <div
            className="h-5 w-20 rounded"
            style={{
              background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            className="h-8 w-8 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function HeroSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full rounded-[2rem] overflow-hidden ${className}`}>
      <div
        className="w-full h-[400px] md:h-[600px]"
        style={{
          background: 'linear-gradient(135deg, #FFF7F9 0%, #FDECEF 50%, #FFF7F9 100%)',
        }}
      >
        <div className="p-8 md:p-16 space-y-4">
          <div
            className="h-3 w-20 rounded"
            style={{
              background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            className="h-10 w-3/4 rounded"
            style={{
              background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div
            className="h-4 w-1/2 rounded"
            style={{
              background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
          <div className="flex gap-3 pt-4">
            <div
              className="h-10 w-32 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
            <div
              className="h-10 w-28 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}