"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { searchProducts, SORT_OPTIONS, TRENDING_SEARCHES } from "@/lib/data/products";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { getNoResultRecommendations, getSearchSuggestions } from "@/lib/search";

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [sort, setSort] = useState("featured");
  const suggestions = useMemo(() => getSearchSuggestions(q, 8), [q]);
  const noResultRecommendations = useMemo(() => getNoResultRecommendations(q, 8), [q]);

  const results = useMemo(() => {
    const found = searchProducts(q);
    switch (sort) {
      case "price-asc": found.sort((a, b) => a.price - b.price); break;
      case "price-desc": found.sort((a, b) => b.price - a.price); break;
      case "newest": found.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0)); break;
      case "best-sellers": found.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
      case "most-reviewed": found.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
      default: break;
    }
    return found;
  }, [q, sort]);

  return (
    <div className="min-h-screen bg-cream-50">
      <section className="relative overflow-hidden bg-brand-blush py-12 md:py-20">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <nav className="mb-5 flex items-center gap-2 text-sm text-cream-400">
              <Link href="/" className="cursor-pointer transition-colors hover:text-brand-rose">Home</Link>
              <span>/</span>
              <span className="text-ink">Search</span>
            </nav>
            <p className="type-label text-xs font-bold uppercase tracking-[0.24em] text-brand-rose">Find your glow</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.98] text-ink md:text-7xl">
              {q ? <>Results for <span className="italic text-brand-rose">&ldquo;{q}&rdquo;</span></> : "Search GLAMO"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-cream-400">
              {q ? `${results.length} product${results.length !== 1 ? "s" : ""} found across skincare, makeup and routine-ready picks.` : "Try sunscreen, vitamin C, lip tint, Korean skincare or Made in Nepal to jump into curated product results."}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-none border border-cream-200 bg-cream-50">
            <Image src="/images/editorial/newsletter-vanity.svg" alt="GLAMO search visual" fill className="object-cover" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        {!q ? (
          <div className="rounded-none border border-cream-200 bg-cream-50 p-8 text-center shadow-editorial md:p-12">
            <Search size={46} className="mx-auto mb-4 text-brand-rose/40" strokeWidth={1.5} />
            <p className="font-display text-3xl text-ink">Search by product, brand or concern</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cream-400">Use quick searches below or open the search icon in the navbar for instant suggestions.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {TRENDING_SEARCHES.slice(0, 10).map((term) => (
                <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="cursor-pointer rounded-none border border-brand-rose/20 bg-brand-rose/5 px-4 py-2 text-sm font-bold text-brand-rose transition-colors hover:bg-brand-rose hover:text-white">
                  {term}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center">
            <div className="mx-auto max-w-3xl"><EmptyState variant="search" query={q} /></div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.slice(0, 6).map((suggestion) => (
                <Link key={`${suggestion.type}-${suggestion.href}`} href={suggestion.href} className="cursor-pointer rounded-none border border-brand-rose/20 bg-brand-rose/5 px-4 py-2 text-sm font-bold text-brand-rose transition-colors hover:bg-brand-rose hover:text-white">
                  {suggestion.label}
                </Link>
              ))}
            </div>
            <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-4 text-left md:grid-cols-4 md:gap-6">
              {noResultRecommendations.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <Link href="/shop" className="mt-8 inline-flex cursor-pointer rounded-none bg-ink px-8 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-rose">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between rounded-none border border-cream-200 bg-cream-50 p-4 shadow-soft">
              <span className="text-sm font-semibold text-cream-400">{results.length} product{results.length !== 1 ? "s" : ""}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer border-b border-cream-300 bg-cream-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-rose">
                {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {results.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}