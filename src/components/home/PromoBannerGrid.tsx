

import { PromoBannerSummerGlow, PromoBannerNewArrivals } from "@/components/ui/illustrations/PromoBanners";

export function PromoBannerGrid() {
  return (
    <section aria-label="Promotional offers" className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <PromoBannerSummerGlow />
          <PromoBannerNewArrivals />
        </div>
      </div>
    </section>
  );
}