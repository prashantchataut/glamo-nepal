import { ProductCardSkeleton as BrandedProductCardSkeleton, HeroSkeleton } from "@/components/ui/illustrations/LoadingSkeletons";

export default function ShopLoading() {
  return (
    <main className="bg-neutral-50 py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-8 w-48 rounded skeleton-shimmer" />
        <div className="mt-4 h-12 w-80 rounded skeleton-shimmer" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BrandedProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

export { BrandedProductCardSkeleton, HeroSkeleton };