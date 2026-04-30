"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Clock, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";
import { searchProducts, TRENDING_SEARCHES } from "@/lib/mock/products";
import { ProductCard } from "@/components/product/ProductCard";
import { getNoResultRecommendations, getSearchSuggestions } from "@/lib/search";
import { trackEvent } from "@/lib/analytics";

export function SearchModal() {
  const { isSearchModalOpen, closeSearchModal } = useUIStore();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<ReturnType<typeof searchProducts>>([]);
  const suggestions = getSearchSuggestions(query, 7);
  const noResultRecommendations = getNoResultRecommendations(query, 4);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("glamo-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (isSearchModalOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isSearchModalOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isSearchModalOpen]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setResults(searchProducts(query));
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    try {
      const stored = localStorage.getItem("glamo-recent-searches");
      const recent = stored ? JSON.parse(stored) : [];
      const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 5);
      localStorage.setItem("glamo-recent-searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
    const resultCount = searchProducts(searchQuery).length;
    trackEvent("search_submitted", { query: searchQuery, results: resultCount });
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    closeSearchModal();
  }, [router, closeSearchModal]);

  const clearRecent = () => {
    try {
      localStorage.removeItem("glamo-recent-searches");
      setRecentSearches([]);
    } catch {}
  };

  return (
    <AnimatePresence>
      {isSearchModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearchModal}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white shadow-2xl"
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex items-center gap-4 py-4 border-b border-border/30">
                <Search size={20} className="text-brand-textMuted shrink-0" strokeWidth={1.5} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                  placeholder="Search for products, brands, categories..."
                  className="flex-1 text-lg bg-transparent outline-none placeholder:text-brand-textMuted/50 text-brand-textPrimary"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="p-1.5 hover:bg-brand-bgLight rounded-full transition-colors">
                    <X size={18} className="text-brand-textMuted" />
                  </button>
                )}
                <button onClick={closeSearchModal} className="text-sm font-semibold text-brand-textMuted hover:text-brand-textPrimary transition-colors">
                  Cancel
                </button>
              </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6 max-h-[70vh] overflow-y-auto">
              {query.trim().length >= 2 && results.length > 0 ? (
                <div>
                  <p className="text-sm text-brand-textMuted mb-4">{results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;</p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {suggestions.slice(0, 5).map((suggestion) => (
                      <button key={`${suggestion.type}-${suggestion.href}`} type="button" onClick={() => { closeSearchModal(); router.push(suggestion.href); }} className="inline-flex items-center gap-1 rounded-full bg-brand-bgLight px-3 py-1.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">
                        <Sparkles size={12} /> {suggestion.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.slice(0, 8).map((product) => (
                      <div key={product.id} onClick={() => { closeSearchModal(); router.push(`/product/${product.slug}`); }} className="cursor-pointer">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                  {results.length > 8 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => handleSearch(query)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-colors"
                      >
                        View All Results <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : query.trim().length >= 2 && results.length === 0 ? (
                <div className="text-center py-12">
                  <Search size={48} className="text-brand-textMuted/20 mx-auto mb-4" />
                  <p className="font-serif text-xl text-brand-textPrimary mb-2">No results found</p>
                  <p className="text-sm text-brand-textMuted">Try a popular search or browse these best-match recommendations.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {TRENDING_SEARCHES.slice(0, 5).map((term) => (
                      <button key={term} onClick={() => { setQuery(term); handleSearch(term); }} className="rounded-full bg-brand-bgLight px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">{term}</button>
                    ))}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {noResultRecommendations.map((product) => <ProductCard key={product.id} product={product} />)}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-brand-textMuted flex items-center gap-2">
                          <Clock size={14} /> Recent Searches
                        </h3>
                        <button onClick={clearRecent} className="text-xs text-brand-textMuted hover:text-brand-primary transition-colors">Clear</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s) => (
                          <button
                            key={s}
                            onClick={() => { setQuery(s); handleSearch(s); }}
                            className="px-4 py-2 bg-brand-bgLight rounded-full text-sm text-brand-textPrimary hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-brand-textMuted flex items-center gap-2 mb-3">
                      <TrendingUp size={14} /> Trending Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setQuery(s); handleSearch(s); }}
                          className="px-4 py-2 bg-brand-bgLight rounded-full text-sm text-brand-textPrimary hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}