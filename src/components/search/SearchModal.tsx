"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock, RefreshCw, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { searchProducts } from "@/lib/api/catalog";
import { TRENDING_SEARCHES } from "@/lib/data/products";
import { getSearchSuggestions } from "@/lib/search";
import { trackEvent } from "@/lib/analytics";
import { formatNPR } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import type { Product } from "@/types/product";

export function SearchModal() {
  const { isSearchModalOpen, closeSearchModal } = useUIStore();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const suggestions = getSearchSuggestions(debouncedQuery, 7);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("glamo-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (isSearchModalOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
    if (!isSearchModalOpen) {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(0);
      setResults([]);
      setSearchError(null);
    }
  }, [isSearchModalOpen]);

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setSearchError(null);

    searchProducts(debouncedQuery, 8)
      .then((result) => {
        if (cancelled) return;
        if (result.status === "success" && result.data) {
          setResults(result.data.slice(0, 8));
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
        setSearchError("Search unavailable. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    if (isSearchModalOpen) {
      const width = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${width}px`;
      document.body.classList.add("scroll-locked");
    } else {
      document.body.style.paddingRight = "";
      document.body.classList.remove("scroll-locked");
    }
    return () => {
      document.body.style.paddingRight = "";
      document.body.classList.remove("scroll-locked");
    };
  }, [isSearchModalOpen]);

  const saveRecent = useCallback((searchQuery: string) => {
    try {
      const stored = localStorage.getItem("glamo-recent-searches");
      const recent: string[] = stored ? JSON.parse(stored) : [];
      const updated = [searchQuery, ...recent.filter((term) => term.toLowerCase() !== searchQuery.toLowerCase())].slice(0, 5);
      localStorage.setItem("glamo-recent-searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { /* noop */ }
  }, []);

  const goToSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    trackEvent("search_submitted", { query: trimmed });
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    closeSearchModal();
  }, [closeSearchModal, router, saveRecent]);

  const goToProduct = useCallback((index: number) => {
    const product = results[index];
    if (!product) return;
    saveRecent(debouncedQuery || product.name);
    router.push(`/product/${product.slug}`);
    closeSearchModal();
  }, [closeSearchModal, debouncedQuery, results, router, saveRecent]);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSearchModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearchModal();
      if (event.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) { event.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if (event.key === "ArrowDown" && results.length) {
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (event.key === "ArrowUp" && results.length) {
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (results.length) { goToProduct(activeIndex); } else { goToSearch(query); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, closeSearchModal, goToProduct, goToSearch, isSearchModalOpen, query, results.length]);

  function clearRecent() {
    try {
      localStorage.removeItem("glamo-recent-searches");
      setRecentSearches([]);
    } catch { /* noop */ }
  }

  return (
    <AnimatePresence>
      {isSearchModalOpen ? (
        <>
          <motion.div
            key="search-backdrop"
            onClick={closeSearchModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal-backdrop bg-black/50"
          />
          <motion.div
            ref={modalRef}
            key="search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed left-3 right-3 top-3 z-modal overflow-hidden rounded-3xl bg-white shadow-2xl md:left-1/2 md:right-auto md:top-6 md:w-[min(940px,calc(100vw-48px))] md:-translate-x-1/2"
          >
            {/* Search input */}
            <div className="border-b border-neutral-200/80 px-4 md:px-6">
              <div className="flex items-center gap-3 py-4">
                <Search size={20} className="shrink-0 text-neutral-500" strokeWidth={1.5} />
                <label htmlFor="glamo-search-input" className="sr-only">Search GLAMO Nepal products</label>
                <input
                  id="glamo-search-input"
                  ref={inputRef}
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                  placeholder="Search skincare, lipstick, sunscreen..."
                  className="min-h-11 flex-1 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400 md:text-lg"
                  aria-controls="glamo-search-results"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Clear search"
                  >
                    <X size={18} className="text-neutral-500" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeSearchModal}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Close search"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Results */}
            <div id="glamo-search-results" aria-live="polite" className="max-h-[78vh] overflow-y-auto px-4 py-6 md:px-6">
              {searchError ? (
                <div className="py-12 text-center">
                  <RefreshCw size={24} className="mx-auto text-neutral-300" strokeWidth={1.5} />
                  <p className="mt-4 text-sm text-neutral-500">{searchError}</p>
                  <button
                    type="button"
                    onClick={() => { setSearchError(null); setDebouncedQuery(query); }}
                    className="mt-3 text-xs font-semibold uppercase tracking-widest text-primary transition hover:text-primary"
                  >
                    Retry
                  </button>
                </div>
              ) : isLoading ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-primary" />
                  <p className="mt-3 text-sm text-neutral-400">Searching...</p>
                </div>
              ) : debouncedQuery.trim().length >= 2 && results.length > 0 ? (
                <div>
                  <p className="mb-4 text-sm text-neutral-500">
                    {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{debouncedQuery}&rdquo;
                  </p>
                  {suggestions.length ? (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {suggestions.slice(0, 5).map((suggestion) => (
                        <button
                          key={`${suggestion.type}-${suggestion.href}`}
                          type="button"
                          onClick={() => { closeSearchModal(); router.push(suggestion.href); }}
                          className="font-label inline-flex items-center gap-1 rounded-full bg-neutral-50 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-white"
                        >
                          <Sparkles size={12} /> {suggestion.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    {results.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goToProduct(index)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          activeIndex === index
                            ? "border-primary bg-primary/10"
                            : "border-neutral-200/80 bg-white hover:bg-neutral-50"
                        }`}
                        aria-current={activeIndex === index ? "true" : undefined}
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
                          <Image src={product.image} alt={`${product.brand} ${product.name}`} fill className="object-cover" sizes="64px" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">{product.brand}</p>
                          <p className="truncate font-display text-lg font-semibold text-neutral-900">{product.name}</p>
                          <p className="font-display text-sm font-semibold text-neutral-900">{formatNPR(product.price)}</p>
                        </div>
                        <ArrowRight size={16} className="text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : debouncedQuery.trim().length >= 2 ? (
                <div className="py-12 text-center">
                  <Search size={32} className="mx-auto text-neutral-300" strokeWidth={1.5} />
                  <p className="mt-4 text-sm text-neutral-500">
                    No products found for &ldquo;{debouncedQuery}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">Try a different search term.</p>
                </div>
              ) : (
                <div>
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Recent searches</p>
                        <button type="button" onClick={clearRecent} className="text-xs text-neutral-400 hover:text-neutral-600 transition">Clear</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => goToSearch(term)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-500 transition hover:bg-primary hover:text-white"
                          >
                            <Clock size={12} /> {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {TRENDING_SEARCHES.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">Trending</p>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => goToSearch(term)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-500 transition hover:bg-primary hover:text-white"
                          >
                            <TrendingUp size={12} /> {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}