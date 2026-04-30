"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { FEATURED_PRODUCTS } from "@/lib/constants";

export function FeaturedProducts() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">Featured selection</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">Glow heroes worth adding to cart</h2>
            <p className="mt-4 text-base leading-7 text-brand-textMuted">
              A refined edit of skincare, makeup and everyday beauty essentials chosen for gifting, daily use and special occasions.
            </p>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary transition hover:text-brand-bgDark">
            Shop the full collection <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {FEATURED_PRODUCTS.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
