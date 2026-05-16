import { ProductCardSkeleton as BrandedProductCardSkeleton, HeroSkeleton } from "@/components/ui/illustrations/LoadingSkeletons";

export default function ShopLoading() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-8 w-48 rounded" style={{ background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
        <div className="mt-4 h-12 w-80 rounded" style={{ background: 'linear-gradient(90deg, #FDECEF 25%, #FFF7F9 50%, #FDECEF 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
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