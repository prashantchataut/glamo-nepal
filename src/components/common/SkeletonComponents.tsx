export function AuthFormSkeleton() {
  return (
    <div className="bg-neutral-100 py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="mt-8 space-y-5">
          <div className="w-full">
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-neutral-200" />
            <div className="h-12 w-full animate-pulse rounded-[1.5rem] bg-neutral-200" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-full bg-neutral-200" />
        </div>
        <div className="mt-6 h-4 w-32 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-xl bg-neutral-200" />
          <div className="mt-3 h-4 w-3/4 rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-1/3 rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="bg-neutral-100 py-10 md:py-16">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-8 space-y-6">
          <div className="h-12 w-full animate-pulse rounded-[1.5rem] bg-neutral-200" />
          <div className="h-12 w-full animate-pulse rounded-[1.5rem] bg-neutral-200" />
          <div className="h-12 w-3/4 animate-pulse rounded-[1.5rem] bg-neutral-200" />
          <div className="h-12 w-full animate-pulse rounded-[1.5rem] bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

export function OrderTrackSkeleton() {
  return (
    <div className="bg-neutral-100 py-10 md:py-16">
      <div className="container mx-auto max-w-2xl px-4 md:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-[1.5rem] bg-neutral-200" />
        <div className="mt-4 h-64 w-full animate-pulse rounded-2xl bg-neutral-200" />
      </div>
    </div>
  );
}