"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { searchProducts, SORT_OPTIONS, TRENDING_SEARCHES } from "@/lib/mock/products";
import { ProductCard } from "@/components/product/ProductCard";
import { getNoResultRecommendations, getSearchSuggestions } from "@/lib/search";
import Link from "next/link";

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
    <div className="min-h-screen bg-brand-bgLight">
      <div className="bg-brand-bgDark text-white py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4 flex items-center justify-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Search</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-3">
            {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
          </h1>
          {q && <p className="text-white/70">{results.length} product{results.length !== 1 ? "s" : ""} found</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        {!q ? (
          <div className="text-center py-20">
            <Search size={48} className="text-brand-textMuted/20 mx-auto mb-4" />
            <p className="font-serif text-xl text-brand-textPrimary mb-2">Enter a search term to find products</p>
            <p className="text-sm text-brand-textMuted">Try searching for &ldquo;Vitamin C&rdquo;, &ldquo;serum&rdquo;, or &ldquo;Made in Nepal&rdquo;.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {TRENDING_SEARCHES.slice(0, 8).map((term) => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-brand-primary hover:text-white">{term}</Link>)}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search size={48} className="text-brand-textMuted/20 mx-auto mb-4" />
            <p className="font-serif text-2xl text-brand-textPrimary mb-2">No results for &ldquo;{q}&rdquo;</p>
            <p className="text-brand-textMuted mb-6">Try a different search term, use a suggestion, or browse these recommendations.</p>
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {suggestions.slice(0, 6).map((suggestion) => <Link key={`${suggestion.type}-${suggestion.href}`} href={suggestion.href} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-primary shadow-sm transition hover:bg-brand-primary hover:text-white">{suggestion.label}</Link>)}
            </div>
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 text-left md:grid-cols-4 md:gap-6">
              {noResultRecommendations.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <Link href="/shop" className="mt-8 inline-block px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-colors">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-brand-textMuted">{results.length} product{results.length !== 1 ? "s" : ""}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm border border-border rounded-full px-4 py-2.5 bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}