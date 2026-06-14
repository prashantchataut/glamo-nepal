import { ProductCardSkeleton } from "@/components/ui/illustrations/LoadingSkeletons";

export default function ProductDetailLoading() {
  return (
    <main className="bg-neutral-50 section-padding page-padding">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div className="aspect-[4/5] rounded-[2rem] skeleton-shimmer" />
          <div className="space-y-4">
            <div className="h-3 w-20 rounded skeleton-shimmer" />
            <div className="h-8 w-3/4 rounded skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded skeleton-shimmer" />
            <div className="mt-6 h-6 w-32 rounded skeleton-shimmer" />
            <div className="mt-4 h-12 w-full rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    </main>
  );
}