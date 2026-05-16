"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { ProductCard } from "@/components/product/ProductCard";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";

export function RecentlyViewedStrip({ excludeSlug }: { excludeSlug?: string }) {
  const items = useRecentlyViewedStore((s) => s.items).filter((p) => p.slug !== excludeSlug).slice(0, 4);
  if (!items.length) return null;
  return (
    <section className="bg-cream-50 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div><p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Your beauty trail</p><h2 className="font-display text-3xl font-semibold text-brand-textPrimary">Recently viewed</h2></div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </div>
    </section>
  );
}
