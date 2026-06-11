"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, AlertCircle, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { MobileFilterSheet } from "@/components/shop/MobileFilterSheet";
import { ShopFilterSidebar, type FilterState } from "@/components/shop/ShopFilterSidebar";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/data/products";
import { listProducts, type ProductListParams } from "@/lib/api/catalog";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { trackCategoryView } from "@/lib/tracking";

const PRICE_RANGE = { min: 0, max: 50000 };
const DEFAULT_FILTERS: FilterState = {
  category: "",
  subCategory: "",
  brands: [],
  skinType: [],
  concerns: [],
  madeInNepal: false,
  search: "",
  minPrice: PRICE_RANGE.min,
  maxPrice: PRICE_RANGE.max,
  rating: 0,
  inStock: false,
  sort: "featured",
};

type FilterChip = { key: string; label: string; remove: () => FilterState };

function filtersFromParams(params: URLSearchParams): FilterState {
  const minParam = Number(params.get("minPrice"));
  const maxParam = Number(params.get("maxPrice"));
  return {
    ...DEFAULT_FILTERS,
    category: params.get("category") || "",
    subCategory: params.get("subCategory") || "",
    brands: params.get("brands")?.split(",").filter(Boolean) || [],
    skinType: params.get("skinType")?.split(",").filter(Boolean) || [],
    concerns: params.get("concerns")?.split(",").filter(Boolean) || [],
    madeInNepal: params.get("madeInNepal") === "1",
    search: params.get("q") || "",
    minPrice: Number.isFinite(minParam) && minParam > 0 ? minParam : PRICE_RANGE.min,
    maxPrice: Number.isFinite(maxParam) && maxParam > 0 ? maxParam : PRICE_RANGE.max,
    rating: Number(params.get("rating")) || 0,
    inStock: params.get("inStock") === "1",
    sort: params.get("sort") || "featured",
  };
}

function paramsFromFilters(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.subCategory) params.set("subCategory", filters.subCategory);
  if (filters.brands.length) params.set("brands", filters.brands.join(","));
  if (filters.skinType.length) params.set("skinType", filters.skinType.join(","));
  if (filters.concerns.length) params.set("concerns", filters.concerns.join(","));
  if (filters.madeInNepal) params.set("madeInNepal", "1");
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (filters.minPrice > PRICE_RANGE.min) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice < PRICE_RANGE.max) params.set("maxPrice", String(filters.maxPrice));
  if (filters.rating > 0) params.set("rating", String(filters.rating));
  if (filters.inStock) params.set("inStock", "1");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return params;
}

const ITEMS_PER_PAGE = 12;

export default function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const urlPage = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const goToPage = useCallback(
    (page: number) => {
      const params = paramsFromFilters(filters);
      if (page > 1) params.set("page", String(page));
      router.replace(`/shop${params.toString() ? `?${params}` : ""}`, { scroll: false });
      setCurrentPage(page);
    },
    [router, filters]
  );

  useEffect(() => {
    setCurrentPage(urlPage);
  }, [urlPage]);

  const handleFilterChange = useCallback(
    (next: FilterState) => {
      const params = paramsFromFilters(next);
      router.replace(`/shop${params.toString() ? `?${params}` : ""}`, {
        scroll: false,
      });
      setCurrentPage(1);
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setApiError(null);

    listProducts({
      query: filters.search || undefined,
      category: filters.category || undefined,
      brand: filters.brands.length === 1 ? filters.brands[0] : undefined,
      concern: filters.concerns.length === 1 ? filters.concerns[0] : undefined,
      skinType: filters.skinType.length === 1 ? filters.skinType[0] : undefined,
      madeInNepal: filters.madeInNepal || undefined,
      inStock: filters.inStock || undefined,
      minPrice: filters.minPrice > PRICE_RANGE.min ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < PRICE_RANGE.max ? filters.maxPrice : undefined,
      sort: filters.sort as ProductListParams["sort"],
      page: currentPage,
      perPage: ITEMS_PER_PAGE,
    })
      .then((result) => {
        if (cancelled) return;
        if (result.status === "success" && result.data && result.data.length > 0) {
          setProducts(result.data);
        } else {
          setProducts([]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setApiError("Unable to load products. Please try again.");
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [filters, currentPage]);

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (filters.category) list.push({ key: "category", label: CATEGORIES.find((c) => c.slug === filters.category)?.name || filters.category, remove: () => ({ ...filters, category: "", subCategory: "" }) });
    if (filters.subCategory) list.push({ key: "subCategory", label: filters.subCategory, remove: () => ({ ...filters, subCategory: "" }) });
    if (filters.search) list.push({ key: "search", label: `Search: ${filters.search}`, remove: () => ({ ...filters, search: "" }) });
    filters.brands.forEach((brand) => list.push({ key: `brand-${brand}`, label: brand, remove: () => ({ ...filters, brands: filters.brands.filter((v) => v !== brand) }) }));
    filters.skinType.forEach((st) => list.push({ key: `skin-${st}`, label: st, remove: () => ({ ...filters, skinType: filters.skinType.filter((v) => v !== st) }) }));
    filters.concerns.forEach((c) => list.push({ key: `concern-${c}`, label: c, remove: () => ({ ...filters, concerns: filters.concerns.filter((v) => v !== c) }) }));
    if (filters.madeInNepal) list.push({ key: "madeInNepal", label: "Made in Nepal", remove: () => ({ ...filters, madeInNepal: false }) });
    if (filters.inStock) list.push({ key: "inStock", label: "In stock", remove: () => ({ ...filters, inStock: false }) });
    if (filters.minPrice > PRICE_RANGE.min || filters.maxPrice < PRICE_RANGE.max) list.push({ key: "price", label: `Rs. ${filters.minPrice.toLocaleString()} - Rs. ${filters.maxPrice.toLocaleString()}`, remove: () => ({ ...filters, minPrice: PRICE_RANGE.min, maxPrice: PRICE_RANGE.max }) });
    return list;
  }, [filters]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const categoryObj = CATEGORIES.find((c) => c.slug === filters.category);

  useEffect(() => {
    if (filters.category) trackCategoryView({ category_slug: filters.category });
  }, [filters.category]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0">
      {/* Page header */}
      <section className="bg-gradient-to-b from-rose-50 via-white to-white py-12 md:py-18">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div>
            <h1 className="font-display text-5xl font-light leading-none tracking-[-0.02em] text-neutral-900 md:text-7xl">
              {categoryObj?.name || "The beauty edit"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600">
              {categoryObj?.description || "Browse skincare, soft-glam makeup, hair care and daily essentials with clear pricing, polished filters and authentic GLAMO curation."}
            </p>
          </div>
          
        </div>
      </section>

      {/* Category pills */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleFilterChange({ ...filters, category: filters.category === cat.slug ? "" : cat.slug, subCategory: "" })}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold tracking-wide transition-colors cursor-pointer",
                  filters.category === cat.slug
                    ? "border-primary bg-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary/40 hover:text-primary"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Sidebar ? desktop only */}
          <div className="hidden w-64 shrink-0 lg:block">
            <ShopFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              priceRange={PRICE_RANGE}
            />
          </div>

          {/* Main grid area */}
          <div className="min-w-0 flex-1">
            {/* Sort bar */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:border-neutral-400 lg:hidden cursor-pointer"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {chips.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                      {chips.length}
                    </span>
                  )}
                </button>
                <p className="type-body-sm text-neutral-500">
                  {products.length} result{products.length !== 1 ? "s" : ""}
                </p>
              </div>
              <select
                value={filters.sort}
                onChange={(event) => handleFilterChange({ ...filters, sort: event.target.value })}
                className="border-b border-neutral-300 bg-transparent px-2 py-2 text-sm text-neutral-700 focus:border-primary focus:outline-none cursor-pointer"
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {chips.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                  className="rounded-full bg-primary px-3 py-1.5 text-[11px] tracking-widest uppercase text-white cursor-pointer"
                >
                  Clear All
                </button>
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleFilterChange(chip.remove())}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary hover:text-primary cursor-pointer"
                  >
                    {chip.label}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* Product grid, loading state, or empty state */}
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-primary" />
                <p className="mt-4 text-sm text-neutral-500">Loading products...</p>
              </div>
            ) : apiError ? (
              <div className="py-24 text-center">
                <AlertCircle className="mx-auto h-16 w-16 text-neutral-300" strokeWidth={1} aria-hidden="true" />
                <h2 className="mt-6 font-display text-xl font-semibold text-neutral-900">Unable to load products</h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Something went wrong. Please try again.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setApiError(null);
                    setIsLoading(true);
                    listProducts({
                      query: filters.search || undefined,
                      category: filters.category || undefined,
                      sort: filters.sort as ProductListParams["sort"],
                      page: currentPage,
                      perPage: ITEMS_PER_PAGE,
                    })
                      .then((result) => {
                        if (result.status === "success" && result.data) {
                          setProducts(result.data);
                        }
                      })
                      .catch(() => setApiError("Unable to load products. Please try again."))
                      .finally(() => setIsLoading(false));
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <svg className="mx-auto h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="type-heading-sm mt-6 text-neutral-900">No products found</h2>
                <p className="type-body-md mt-2 text-neutral-500">
                  Try clearing filters or searching for something different.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                  className="mt-6 rounded-full bg-neutral-950 px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                    <button
                      type="button"
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Previous page"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors cursor-pointer",
                          page === currentPage
                            ? "bg-primary text-white"
                            : "border border-neutral-200 text-neutral-700 hover:border-primary hover:text-primary"
                        )}
                        aria-label={`Page ${page}`}
                        aria-current={page === currentPage ? "page" : undefined}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Next page"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MobileFilterSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
        priceRange={PRICE_RANGE}
      />
    </div>
  );
}