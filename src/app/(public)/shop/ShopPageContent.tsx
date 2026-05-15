"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid3X3, LayoutGrid, Search, ShieldCheck, SlidersHorizontal, Sparkles, Truck, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
import { MobileFilterSheet } from "@/components/shop/MobileFilterSheet";
import { ShopFilterSidebar, type FilterState } from "@/components/shop/ShopFilterSidebar";
import { CATEGORIES, PRODUCTS, SORT_OPTIONS, getPriceRange } from "@/lib/data/products";
import { trackCategoryView } from "@/lib/tracking";
import { cn, formatNPR } from "@/lib/utils";

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
    if (filters.minPrice > PRICE_RANGE.min || filters.maxPrice < PRICE_RANGE.max) list.push({ key: "price", label: `रू ${filters.minPrice.toLocaleString()} - रू ${filters.maxPrice.toLocaleString()}`, remove: () => ({ ...filters, minPrice: PRICE_RANGE.min, maxPrice: PRICE_RANGE.max }) });
    return list;
  }, [filters]);

  const categoryObj = CATEGORIES.find((category) => category.slug === filters.category);
  const spotlightProducts = PRODUCTS.filter((product) => product.isBestSeller || product.isNewArrival).slice(0, 3);

  useEffect(() => {
    if (filters.category) {
      trackCategoryView({ category_slug: filters.category });
    }
  }, [filters.category]);

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_44%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-brand-secondary/35 blur-3xl" />
        <div className="container relative mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">रू pricing · Nepal delivery</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-brand-textPrimary md:text-7xl">
              {categoryObj?.name || "All Products"}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-brand-textMuted">
              {categoryObj?.description || "Browse skincare, soft-glam makeup and daily beauty essentials with रू pricing and Nepal delivery."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/collections/best-sellers" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/15 transition hover:bg-brand-primary-hover">Best sellers</Link>
              <Link href="/collections/made-in-nepal" className="rounded-full border border-brand-primary/20 bg-white/70 px-6 py-3 text-sm font-bold text-brand-primary transition hover:bg-white">Made in Nepal</Link>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[{ icon: Truck, title: "Valley delivery", body: "Clear रू checkout" }, { icon: ShieldCheck, title: "Curated catalog", body: "Authenticity-first" }, { icon: Sparkles, title: "Routine ready", body: "Shop by concern" }].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-brand-border bg-white/75 p-4 shadow-sm backdrop-blur">
                    <Icon className="h-5 w-5 text-brand-primary" />
                    <p className="mt-3 text-sm font-bold text-brand-textPrimary">{item.title}</p>
                    <p className="mt-1 text-xs text-brand-textMuted">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_0.72fr]">
            <div className="relative min-h-[360px] overflow-hidden rounded-[2.25rem] bg-white p-4 shadow-[0_28px_90px_-55px_rgba(36,31,34,0.35)] ring-1 ring-brand-border">
              <Image src="/images/editorial/shop-collage.svg" alt="GLAMO product shelf collage" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div className="grid gap-4">
              {spotlightProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`} className="group flex items-center gap-3 rounded-[1.5rem] border border-brand-border bg-white/85 p-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
                  <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-bgLight">
                    <Image src={product.image} alt={product.name} fill className="object-cover transition group-hover:scale-105" sizes="80px" />
                  </span>
                  <span className="min-w-0">
                    <span className="font-label block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">{product.badge || "Glow pick"}</span>
                    <span className="mt-1 line-clamp-2 block font-display text-lg font-semibold leading-tight text-brand-textPrimary">{product.name}</span>
                    <span className="mt-1 block text-sm font-bold text-brand-gold">{formatNPR(product.price)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-brand-border bg-white/55 py-5">
        <div className="container mx-auto flex gap-3 overflow-x-auto px-4 md:px-6">
          {CATEGORIES.map((category) => (
            <button key={category.slug} type="button" onClick={() => handleFilterChange({ ...filters, category: category.slug, subCategory: "" })} className={cn("flex shrink-0 items-center gap-3 rounded-full border px-3 py-2 pr-5 text-sm font-bold transition", filters.category === category.slug ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-textPrimary hover:border-brand-primary/30 hover:text-brand-primary")}>
              <span className="relative h-10 w-10 overflow-hidden rounded-full bg-brand-bgLight"><Image src={category.image} alt="" fill className="object-cover" sizes="40px" /></span>
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <ProductRecommendationStrip title="Recommended for You" subtitle="Personalized picks" context="shop" />

      <div className="container mx-auto px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="hidden w-80 shrink-0 lg:block"><ShopFilterSidebar filters={filters} onFilterChange={handleFilterChange} priceRange={PRICE_RANGE} /></div>
          <div className="min-w-0 flex-1">
            <div className="mb-6 rounded-[2rem] border border-brand-border bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-bgLight px-4 py-2.5 text-sm font-bold lg:hidden">
                    <SlidersHorizontal size={16} /> Filters {chips.length > 0 ? <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs text-white">{chips.length}</span> : null}
                  </button>
                  <div>
                    <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Catalog results</p>
                    <p className="mt-1 text-sm text-brand-textMuted">{products.length} product{products.length === 1 ? "" : "s"} available</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select value={filters.sort} onChange={(event) => handleFilterChange({ ...filters, sort: event.target.value })} className="rounded-full border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/30" aria-label="Sort products">
                    {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <div className="hidden overflow-hidden rounded-full border border-brand-border bg-white sm:flex">
                    <button type="button" onClick={() => setGridCols(3)} className={cn("p-2.5", gridCols === 3 ? "bg-brand-primary text-white" : "text-brand-textMuted")} aria-label="Show 3 column grid"><Grid3X3 size={16} /></button>
                    <button type="button" onClick={() => setGridCols(4)} className={cn("p-2.5", gridCols === 4 ? "bg-brand-primary text-white" : "text-brand-textMuted")} aria-label="Show 4 column grid"><LayoutGrid size={16} /></button>
                  </div>
                </div>
              </div>
              {chips.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-border pt-4">
                  <button type="button" onClick={() => handleFilterChange(DEFAULT_FILTERS)} className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-bold text-white">Clear all</button>
                  {chips.map((chip) => (
                    <button key={chip.key} type="button" onClick={() => handleFilterChange(chip.remove())} className="inline-flex items-center gap-1 rounded-full bg-brand-primary-light px-3 py-1.5 text-xs font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white">
                      {chip.label}<X size={12} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {products.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-brand-secondary/50 bg-white p-12 text-center shadow-sm">
                <Search className="mx-auto mb-3 h-10 w-10 text-brand-primary/45" />
                <h2 className="font-display text-3xl font-semibold text-brand-textPrimary">No GLAMO picks found</h2>
                <p className="mt-2 text-brand-textMuted">Try clearing filters or searching for serum, SPF, lipstick or Made in Nepal.</p>
                <button type="button" onClick={() => handleFilterChange(DEFAULT_FILTERS)} className="mt-6 rounded-full bg-brand-primary px-6 py-3 font-bold text-white">Reset filters</button>
              </div>
            ) : (
              <div className={cn("grid grid-cols-2 gap-4 md:gap-6", gridCols === 3 ? "xl:grid-cols-3" : "lg:grid-cols-3 2xl:grid-cols-4")}>
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
