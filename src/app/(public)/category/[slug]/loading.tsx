import { ProductCardSkeleton } from "@/components/ui/illustrations/LoadingSkeletons";

export default function CategoryLoading() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-8 w-64 animate-pulse rounded bg-white/20" />
          <div className="mt-2 h-5 w-96 animate-pulse rounded bg-white/10" />
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-neutral-100" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}