"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES, SORT_OPTIONS } from "@/lib/data/products";
import { ProductCard } from "@/components/product/ProductCard";

export default function CategoryPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSub, setActiveSub] = useState<string>("");

  const category = CATEGORIES.find(c => c.slug === slug);
  const sort = searchParams.get("sort") || "featured";

  const products = useMemo(() => {
    let result = PRODUCTS.filter(p => p.category === slug);
    if (activeSub) result = result.filter(p => p.subCategory === activeSub);

    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0)); break;
      case "best-sellers": result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
      case "most-reviewed": result.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
      default: result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break;
    }
    return result;
  }, [slug, activeSub, sort]);

  if (!category) {
    return (
      <div className="min-h-screen bg-brand-bgLight flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold mb-4">Category Not Found</h1>
          <p className="text-brand-textMuted mb-6">The category you are looking for does not exist.</p>
          <Link href="/shop" className="px-8 py-3 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-bgDark transition-colors">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_50%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <nav className="mb-5 flex items-center gap-2 text-sm text-brand-textMuted"><Link href="/" className="hover:text-brand-primary">Home</Link><span>/</span><Link href="/shop" className="hover:text-brand-primary">Shop</Link><span>/</span><span className="text-brand-textPrimary">{category.name}</span></nav>
            <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Shop by category</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-brand-textPrimary md:text-7xl">{category.name}</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-brand-textMuted">{category.description}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-border bg-cream-50 shadow-sm"><Image src={category.image} alt={category.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 420px" /></div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveSub("")}
            className={cn(
              "px-5 py-2 rounded-2xl text-sm font-semibold transition-all duration-300",
              !activeSub ? "bg-brand-primary text-white shadow-md" : "bg-cream-50 text-brand-textMuted border border-border hover:border-brand-primary/30 hover:text-brand-primary"
            )}
          >
            All
          </button>
          {category.subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSub(sub === activeSub ? "" : sub)}
              className={cn(
                "px-5 py-2 rounded-2xl text-sm font-semibold transition-all duration-300",
                activeSub === sub ? "bg-brand-primary text-white shadow-md" : "bg-cream-50 text-brand-textMuted border border-border hover:border-brand-primary/30 hover:text-brand-primary"
              )}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-brand-textMuted">{products.length} product{products.length !== 1 ? "s" : ""}</span>
          <select
            value={sort}
            onChange={(e) => router.push(`/category/${slug}?sort=${e.target.value}`, { scroll: false })}
            className="text-sm border border-border rounded-2xl px-4 py-2.5 bg-cream-50 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-display text-2xl font-semibold text-brand-textPrimary mb-2">No products found</h3>
            <p className="text-brand-textMuted mb-6">Try selecting a different sub-category.</p>
            <button onClick={() => setActiveSub("")} className="px-8 py-3 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-bgDark transition-colors">
              View All {category.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}