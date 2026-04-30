"use client";

import { ProductCard } from "@/components/product/ProductCard";
import { MoveRight } from "lucide-react";
import Link from "next/link";
import { FEATURED_PRODUCTS } from "@/lib/constants";

export function FeaturedProducts() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-4 text-brand-textPrimary">
              Shop Our <span className="text-brand-primary italic">Glow Heroes</span>
            </h2>
            <p className="text-brand-textMuted text-lg leading-relaxed">
              Discover our most-loved formulas, carefully curated to transform your daily skincare ritual.
            </p>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-bgDark transition-colors duration-300 shrink-0">
            View All Collection
            <span className="p-2 bg-brand-primary/10 rounded-full group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
              <MoveRight size={16} />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {FEATURED_PRODUCTS.slice(0, 4).map((product, i) => (
            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}