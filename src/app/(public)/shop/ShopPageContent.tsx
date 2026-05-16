"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { MobileFilterSheet } from "@/components/shop/MobileFilterSheet";
import { ShopFilterSidebar, type FilterState } from "@/components/shop/ShopFilterSidebar";
import { CATEGORIES, PRODUCTS, SORT_OPTIONS, getPriceRange } from "@/lib/data/products";
import { cn } from "@/lib/utils";
import { trackCategoryView } from "@/lib/tracking";

const PRICE_RANGE = getPriceRange();
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

export default function ShopPageContent({ initialSearchParams = {} }: { initialSearchParams?: Record<string, string> }) {
  const router = useRouter();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(() => filtersFromParams(new URLSearchParams(initialSearchParams)));

  const handleFilterChange = useCallback(
    (next: FilterState) => {
      const params = paramsFromFilters(next);
      setFilters(next);
      router.replace(`/shop${params.toString() ? `?${params}` : ""}`, {
        scroll: false,
      });
      setCurrentPage(1);
    },
    [router]
  );

  useEffect(() => {
    const syncFromLocation = () => setFilters(filtersFromParams(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, []);

  const products = useMemo(() => {
    let result = [...PRODUCTS];
    const query = filters.search.toLowerCase().trim();
    if (query)
      result = result.filter((product) =>
        [product.name, product.brand, product.sku, product.description, product.category, product.subCategory, ...product.concernTags].join(" ").toLowerCase().includes(query)
      );
    if (filters.category) result = result.filter((product) => product.category === filters.category);
    if (filters.subCategory) result = result.filter((product) => product.subCategory === filters.subCategory);
    if (filters.brands.length) result = result.filter((product) => filters.brands.includes(product.brand));
    if (filters.skinType.length) result = result.filter((product) => product.skinType.some((st) => filters.skinType.includes(st)));
    if (filters.concerns.length) result = result.filter((product) => product.concernTags.some((c) => filters.concerns.includes(c)));
    if (filters.madeInNepal) result = result.filter((product) => product.madeInNepal);
    if (filters.inStock) result = result.filter((product) => product.inStock);
    result = result.filter((product) => product.price >= filters.minPrice && product.price <= filters.maxPrice);
    switch (filters.sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest": result.sort((a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival))); break;
      case "best-sellers": result.sort((a, b) => Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller))); break;
      case "most-reviewed": result.sort((a, b) => b.reviewsCount - a.reviewsCount); break;
      default: result.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
    }
    return result;
  }, [filters]);

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
    if (filters.minPrice > PRICE_RANGE.min || filters.maxPrice < PRICE_RANGE.max) list.push({ key: "price", label: `रू ${filters.minPrice.toLocaleString()} – रू ${filters.maxPrice.toLocaleString()}`, remove: () => ({ ...filters, minPrice: PRICE_RANGE.min, maxPrice: PRICE_RANGE.max }) });
    return list;
  }, [filters]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const categoryObj = CATEGORIES.find((c) => c.slug === filters.category);

  useEffect(() => {
    if (filters.category) trackCategoryView({ category_slug: filters.category });
  }, [filters.category]);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Page header */}
      <section className="bg-brand-blush py-10 md:py-18">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <span className="type-label text-brand-rose">रू pricing · Nepal delivery</span>
            <h1 className="mt-3 text-balance font-display text-[clamp(3rem,14vw,4.8rem)] font-light leading-[0.92] tracking-[-0.04em] text-ink md:text-7xl">
              {categoryObj?.name || "The beauty edit"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-cream-700">
              {categoryObj?.description || "Browse skincare, soft-glam makeup, hair care and daily essentials with clear pricing, polished filters and authentic GLAMO curation."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[1.75rem] border border-cream-200 bg-cream-200 text-center shadow-card">
            <div className="bg-cream-50 p-3"><p className="font-display text-2xl text-brand-rose">{products.length}</p><p className="text-[10px] uppercase tracking-[0.14em] text-cream-400">Products</p></div>
            <div className="bg-cream-50 p-3"><p className="font-display text-2xl text-brand-rose">77</p><p className="text-[10px] uppercase tracking-[0.14em] text-cream-400">Districts</p></div>
            <div className="bg-cream-50 p-3"><p className="font-display text-2xl text-brand-rose">100%</p><p className="text-[10px] uppercase tracking-[0.14em] text-cream-400">Curated</p></div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-b border-cream-200 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleFilterChange({ ...filters, category: filters.category === cat.slug ? "" : cat.slug, subCategory: "" })}
                className={cn(
                  "luxury-chip shrink-0 cursor-pointer",
                  filters.category === cat.slug
                    ? "border-brand-rose bg-brand-rose text-white shadow-[0_16px_36px_-30px_rgba(168,77,94,0.54)]"
                    : ""
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 md:px-6 md:py-12 lg:px-8 lg:pb-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Sidebar — desktop only */}
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
                  className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/80 px-4 py-2.5 text-sm text-cream-700 shadow-[0_14px_34px_-28px_rgba(26,15,11,0.35)] transition-all hover:-translate-y-0.5 hover:border-brand-rose/40 lg:hidden cursor-pointer"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {chips.length > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-rose text-[10px] text-white">
                      {chips.length}
                    </span>
                  )}
                </button>
                <p className="type-body-sm text-cream-400">
                  {products.length} result{products.length !== 1 ? "s" : ""}
                </p>
              </div>
              <select
                value={filters.sort}
                onChange={(event) => handleFilterChange({ ...filters, sort: event.target.value })}
                className="border-b border-cream-300 bg-transparent px-2 py-2 text-sm text-cream-700 focus:border-brand-rose focus:outline-none cursor-pointer"
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
                  className="rounded-full bg-brand-rose px-3 py-1.5 text-[11px] tracking-widest uppercase text-white shadow-[0_12px_28px_-20px_rgba(168,77,94,0.5)] cursor-pointer"
                >
                  Clear All
                </button>
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => handleFilterChange(chip.remove())}
                    className="inline-flex items-center gap-1 rounded-full border border-cream-200 bg-white/80 px-3 py-1.5 text-xs text-cream-700 transition-all hover:-translate-y-0.5 hover:border-brand-rose hover:text-brand-rose cursor-pointer"
                  >
                    {chip.label}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {/* Product grid or empty state */}
            {products.length === 0 ? (
              <div className="py-24 text-center">
                <svg className="mx-auto h-16 w-16 text-cream-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h2 className="type-heading-sm mt-6 text-ink">No products found</h2>
                <p className="type-body-md mt-2 text-cream-400">
                  Try clearing filters or searching for something different.
                </p>
                <button
                  type="button"
                  onClick={() => handleFilterChange(DEFAULT_FILTERS)}
                  className="luxury-button luxury-button-dark mt-6 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-6 xl:grid-cols-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-200 text-cream-700 transition-colors hover:border-brand-rose hover:text-brand-rose disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Previous page"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors cursor-pointer",
                          page === currentPage
                            ? "bg-brand-rose text-white"
                            : "border border-cream-200 text-cream-700 hover:border-brand-rose hover:text-brand-rose"
                        )}
                        aria-label={`Page ${page}`}
                        aria-current={page === currentPage ? "page" : undefined}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-200 text-cream-700 transition-colors hover:border-brand-rose hover:text-brand-rose disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream-200 bg-cream-50/96 px-4 py-3 shadow-[0_-18px_50px_-36px_rgba(26,15,11,0.45)] backdrop-blur-md lg:hidden safe-area-bottom">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink bg-ink text-label-sm font-semibold uppercase tracking-[0.15em] text-white shadow-[0_18px_42px_-24px_rgba(26,15,11,0.48)]"
          >
            <SlidersHorizontal size={15} /> Filter {chips.length > 0 ? `(${chips.length})` : ""}
          </button>
          <label className="relative inline-flex min-h-12 items-center justify-center rounded-full border border-cream-200 bg-white/85 text-label-sm font-semibold uppercase tracking-[0.15em] text-ink shadow-[0_18px_42px_-30px_rgba(26,15,11,0.32)]">
            <span className="pointer-events-none">Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => handleFilterChange({ ...filters, sort: event.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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