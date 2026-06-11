"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { searchProducts as mockSearchProducts, SORT_OPTIONS, TRENDING_SEARCHES } from "@/lib/data/products";
import { searchProducts as apiSearchProducts } from "@/lib/api/catalog";
import type { Product } from "@/types/product";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { getNoResultRecommendations, getSearchSuggestions } from "@/lib/search";

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [sort, setSort] = useState("featured");
  const [liveResults, setLiveResults] = useState<Product[] | null>(null);
  const suggestions = useMemo(() => getSearchSuggestions(q, 8), [q]);
  const noResultRecommendations = useMemo(() => getNoResultRecommendations(q, 8), [q]);

  // Prefer live catalog search; fall back to the static catalog on error/empty.
  useEffect(() => {
    if (!q.trim()) { setLiveResults(null); return; }
    let cancelled = false;
    apiSearchProducts(q, 48)
      .then((result) => {
        if (cancelled) return;
        setLiveResults(result.status === "success" && result.data.length > 0 ? result.data : null);
      })
      .catch(() => { if (!cancelled) setLiveResults(null); });
    return () => { cancelled = true; };
  }, [q]);

  const results = useMemo(() => {
    const found = [...(liveResults ?? mockSearchProducts(q))];
    switch (sort) {
      case "price-asc": found.sort((a, b) => a.price - b.price); break;
      case "price-desc": found.sort((a, b) => b.price - a.price); break;
      case "newest": found.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0)); break;
      case "best-sellers": found.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0)); break;
      case "most-reviewed": found.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
      default: break;
    }
    return found;
  }, [q, sort, liveResults]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="relative overflow-hidden bg-rose-50 py-12 md:py-20">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <nav className="mb-5 flex items-center gap-2 text-sm text-neutral-500">
              <Link href="/" className="cursor-pointer transition-colors hover:text-primary">Home</Link>
              <span>/</span>
              <span className="text-neutral-900">Search</span>
            </nav>
            <p className="type-label text-xs font-bold uppercase tracking-[0.24em] text-primary">Find your glow</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.98] text-neutral-900 md:text-7xl">
              {q ? <>Results for <span className="italic text-primary">&ldquo;{q}&rdquo;</span></> : "Search GLAMO"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-500">
              {q ? `${results.length} product${results.length !== 1 ? "s" : ""} found across skincare, makeup and routine-ready picks.` : "Try sunscreen, vitamin C, lip tint, Korean skincare or Made in Nepal to jump into curated product results."}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2.25rem] border border-neutral-200 bg-white">
            <Image src="/images/editorial/newsletter-vanity.svg" alt="GLAMO search visual" fill className="object-cover" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        {!q ? (
          <div className="rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-editorial md:p-12">
            <Search size={46} className="mx-auto mb-4 text-primary/40" strokeWidth={1.5} />
            <p className="font-display text-3xl text-neutral-900">Search by product, brand or concern</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">Use quick searches below or open the search icon in the navbar for instant suggestions.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {TRENDING_SEARCHES.slice(0, 10).map((term) => (
                <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="cursor-pointer rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white">
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
                <Link key={`${suggestion.type}-${suggestion.href}`} href={suggestion.href} className="cursor-pointer rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white">
                  {suggestion.label}
                </Link>
              ))}
            </div>
            <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-4 text-left md:grid-cols-4 md:gap-6">
              {noResultRecommendations.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <Link href="/shop" className="mt-8 inline-flex cursor-pointer rounded-full bg-neutral-950 px-8 py-3 text-sm font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-soft">
              <span className="text-sm font-semibold text-neutral-500">{results.length} product{results.length !== 1 ? "s" : ""}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer border-b border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary">
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