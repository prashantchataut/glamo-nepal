export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-2xl ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-[1.5rem] border border-brand-border bg-white p-4">
      <div className="skeleton-shimmer aspect-[4/5] rounded-xl" />
      <div className="mt-4 space-y-2">
        <div className="skeleton-shimmer h-3 w-16 rounded-full" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded" />
        <div className="mt-3 skeleton-shimmer h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-shimmer h-4 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonImage({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer aspect-square rounded-2xl ${className}`} />;
}