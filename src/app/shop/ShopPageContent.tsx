"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid3X3, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { MobileFilterSheet } from "@/components/shop/MobileFilterSheet";
import { ShopFilterSidebar, type FilterState } from "@/components/shop/ShopFilterSidebar";
import { CATEGORIES, PRODUCTS, SORT_OPTIONS, getPriceRange } from "@/lib/mock/products";
import { cn } from "@/lib/utils";

const PRICE_RANGE = getPriceRange();
const DEFAULT_FILTERS: FilterState = { category: "", subCategory: "", brands: [], skinType: [], concerns: [], madeInNepal: false, search: "", minPrice: PRICE_RANGE.min, maxPrice: PRICE_RANGE.max, rating: 0, inStock: false, sort: "featured" };

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

export default function ShopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);

  const handleFilterChange = useCallback((next: FilterState) => {
    const params = paramsFromFilters(next);
    router.replace(`/shop${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [router]);

  const products = useMemo(() => {
    let result = [...PRODUCTS];
    const query = filters.search.toLowerCase().trim();
    if (query) result = result.filter((product) => [product.name, product.brand, product.sku, product.description, product.category, product.subCategory, ...product.concernTags].join(" ").toLowerCase().includes(query));
    if (filters.category) result = result.filter((product) => product.category === filters.category);
    if (filters.subCategory) result = result.filter((product) => product.subCategory === filters.subCategory);
    if (filters.brands.length) result = result.filter((product) => filters.brands.includes(product.brand));
    if (filters.skinType.length) result = result.filter((product) => product.skinType.some((skinType) => filters.skinType.includes(skinType)));
    if (filters.concerns.length) result = result.filter((product) => product.concernTags.some((concern) => filters.concerns.includes(concern)));
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
    if (filters.category) list.push({ key: "category", label: CATEGORIES.find((category) => category.slug === filters.category)?.name || filters.category, remove: () => ({ ...filters, category: "", subCategory: "" }) });
    if (filters.subCategory) list.push({ key: "subCategory", label: filters.subCategory, remove: () => ({ ...filters, subCategory: "" }) });
    if (filters.search) list.push({ key: "search", label: `Search: ${filters.search}`, remove: () => ({ ...filters, search: "" }) });
    filters.brands.forEach((brand) => list.push({ key: `brand-${brand}`, label: brand, remove: () => ({ ...filters, brands: filters.brands.filter((value) => value !== brand) }) }));
    filters.skinType.forEach((skinType) => list.push({ key: `skin-${skinType}`, label: skinType, remove: () => ({ ...filters, skinType: filters.skinType.filter((value) => value !== skinType) }) }));
    filters.concerns.forEach((concern) => list.push({ key: `concern-${concern}`, label: concern, remove: () => ({ ...filters, concerns: filters.concerns.filter((value) => value !== concern) }) }));
    if (filters.madeInNepal) list.push({ key: "madeInNepal", label: "Made in Nepal", remove: () => ({ ...filters, madeInNepal: false }) });
    if (filters.inStock) list.push({ key: "inStock", label: "In stock", remove: () => ({ ...filters, inStock: false }) });
    if (filters.minPrice > PRICE_RANGE.min || filters.maxPrice < PRICE_RANGE.max) list.push({ key: "price", label: `${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()} NPR`, remove: () => ({ ...filters, minPrice: PRICE_RANGE.min, maxPrice: PRICE_RANGE.max }) });
    return list;
  }, [filters]);

  const categoryObj = CATEGORIES.find((category) => category.slug === filters.category);

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <section className="bg-brand-bgDark py-14 text-white md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">NPR pricing · Nepal delivery mock</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">{categoryObj?.name || "Shop GLAMO"}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">{categoryObj?.description || "Filter by category, brand, concern, Made in Nepal, stock and price to explore the mock Nepal-market catalog."}</p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="hidden w-72 shrink-0 lg:block"><ShopFilterSidebar filters={filters} onFilterChange={handleFilterChange} priceRange={PRICE_RANGE} /></div>
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold lg:hidden">
                  <SlidersHorizontal size={16} /> Filters {chips.length > 0 ? <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs text-white">{chips.length}</span> : null}
                </button>
                <p className="text-sm text-brand-textMuted">{products.length} product{products.length === 1 ? "" : "s"}</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={filters.sort} onChange={(event) => handleFilterChange({ ...filters, sort: event.target.value })} className="rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" aria-label="Sort products">
                  {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <div className="hidden overflow-hidden rounded-full border border-border bg-white sm:flex">
                  <button type="button" onClick={() => setGridCols(3)} className={cn("p-2.5", gridCols === 3 ? "bg-brand-primary text-white" : "text-brand-textMuted")} aria-label="Show 3 column grid"><Grid3X3 size={16} /></button>
                  <button type="button" onClick={() => setGridCols(4)} className={cn("p-2.5", gridCols === 4 ? "bg-brand-primary text-white" : "text-brand-textMuted")} aria-label="Show 4 column grid"><LayoutGrid size={16} /></button>
                </div>
              </div>
            </div>
            {chips.length > 0 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                <button type="button" onClick={() => handleFilterChange(DEFAULT_FILTERS)} className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white">Clear all</button>
                {chips.map((chip) => (
                  <button key={chip.key} type="button" onClick={() => handleFilterChange(chip.remove())} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">
                    {chip.label}<X size={12} />
                  </button>
                ))}
              </div>
            ) : null}
            {products.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-brand-secondary/40 bg-white p-12 text-center">
                <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">No GLAMO picks found</h2>
                <p className="mt-2 text-brand-textMuted">Try clearing filters or searching for serum, SPF, lipstick or Made in Nepal.</p>
                <button type="button" onClick={() => handleFilterChange(DEFAULT_FILTERS)} className="mt-6 rounded-full bg-brand-primary px-6 py-3 font-semibold text-white">Reset filters</button>
              </div>
            ) : (
              <div className={cn("grid grid-cols-2 gap-4 md:gap-6", gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileFilterSheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen} filters={filters} onFilterChange={handleFilterChange} priceRange={PRICE_RANGE} />
    </div>
  );
}
