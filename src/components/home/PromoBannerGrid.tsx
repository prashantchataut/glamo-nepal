"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { PromoBannerSummerGlow, PromoBannerNewArrivals } from "@/components/ui/illustrations/PromoBanners";

export function PromoBannerGrid() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <PromoBannerSummerGlow />
          <PromoBannerNewArrivals />
        </div>
      </div>
    </section>
  );
}