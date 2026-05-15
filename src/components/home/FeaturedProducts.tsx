"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { FEATURED_PRODUCTS } from "@/lib/constants";

export function FeaturedProducts() {
  return (
    <section className="bg-white py-16 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">Featured selection</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-brand-textPrimary md:text-5xl">Glow heroes worth adding to cart</h2>
            <p className="mt-4 text-base leading-7 text-brand-textMuted">
              A refined edit of skincare, makeup and everyday beauty essentials chosen for gifting, daily use and special occasions.
            </p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary transition hover:text-brand-bgDark">
            Shop the full collection <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURED_PRODUCTS.slice(0, 4).map((product, i) => (
            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 80}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}