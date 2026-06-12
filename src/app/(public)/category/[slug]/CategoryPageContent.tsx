"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES, SORT_OPTIONS } from "@/lib/data/products";
import { listProducts, type ProductListParams } from "@/lib/api/catalog";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

function sortProducts(list: Product[], sort: string): Product[] {
  const result = [...list];
  switch (sort) {
    case "price-asc": result.sort((a, b) => a.price - b.price); break;
    case "price-desc": result.sort((a, b) => b.price - a.price); break;
    case "newest": result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0)); break;
    case "best-sellers": result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
    case "most-reviewed": result.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
    default: result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break;
  }
  return result;
}

export default function CategoryPageContent({ initialProducts }: { initialProducts?: Product[] }) {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSub, setActiveSub] = useState<string>("");
  const [liveProducts, setLiveProducts] = useState<Product[] | null>(null);
  const [sort, setSort] = useState("featured");

  const category = CATEGORIES.find(c => c.slug === slug);

  useEffect(() => {
    setSort(searchParams.get("sort") || "featured");
  }, [searchParams]);

  // Prefer live catalog data; fall back to the static catalog on error/empty.
  useEffect(() => {
    let cancelled = false;
    listProducts({ category: slug, sort: sort as ProductListParams["sort"], perPage: 60 })
      .then((result) => {
        if (cancelled) return;
        setLiveProducts(result.status === "success" && result.data.length > 0 ? result.data : null);
      })
      .catch(() => { if (!cancelled) setLiveProducts(null); });
    return () => { cancelled = true; };
  }, [slug, sort]);

  const products = useMemo(() => {
    const base = liveProducts && liveProducts.length > 0
      ? liveProducts
      : initialProducts && initialProducts.length > 0
        ? initialProducts
        : PRODUCTS.filter(p => p.category === slug);
    const filtered = activeSub ? base.filter(p => p.subCategory === activeSub) : base;
    return sortProducts(filtered, sort);
  }, [liveProducts, initialProducts, slug, activeSub, sort]);

  if (!category) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold mb-4">Category Not Found</h1>
          <p className="text-neutral-500 mb-6">The category you are looking for does not exist.</p>
          <Link href="/shop" className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-neutral-950 transition-colors">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient py-10 md:py-14">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <nav className="mb-5 flex items-center gap-2 text-sm text-neutral-500"><Link href="/" className="hover:text-primary">Home</Link><span>/</span><Link href="/shop" className="hover:text-primary">Shop</Link><span>/</span><span className="text-neutral-900">{category.name}</span></nav>
            <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">Shop by category</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-neutral-900 md:text-7xl">{category.name}</h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-neutral-500">{category.description}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm"><Image src={category.image} alt={category.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 420px" /></div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveSub("")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300",
              !activeSub ? "bg-primary text-white shadow-md" : "bg-white text-neutral-500 border border-border hover:border-primary/30 hover:text-primary"
            )}
          >
            All
          </button>
          {category.subCategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSub(sub === activeSub ? "" : sub)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                activeSub === sub ? "bg-primary text-white shadow-md" : "bg-white text-neutral-500 border border-border hover:border-primary/30 hover:text-primary"
              )}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-neutral-500">{products.length} product{products.length !== 1 ? "s" : ""}</span>
          <select
            value={sort}
            onChange={(e) => {
              const next = e.target.value;
              setSort(next);
              router.push(`/category/${slug}?sort=${next}`, { scroll: false });
            }}
            className="text-sm border border-border rounded-full px-4 py-2.5 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-display text-2xl font-semibold text-neutral-900 mb-2">No products found</h3>
            <p className="text-neutral-500 mb-6">Try selecting a different sub-category.</p>
            <button onClick={() => setActiveSub("")} className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-neutral-950 transition-colors">
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