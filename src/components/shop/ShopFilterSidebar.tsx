"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, BRANDS, SKIN_TYPES, CONCERNS } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export interface FilterState {
  category: string;
  subCategory: string;
  brands: string[];
  skinType: string[];
  concerns: string[];
  madeInNepal: boolean;
  search: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
  inStock: boolean;
  sort: string;
}

interface Props {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  priceRange: { min: number; max: number };
}

const quickPriceRanges = [
  { label: "Under NPR 1,000", min: 0, max: 1000 },
  { label: "NPR 1,000 - 2,500", min: 1000, max: 2500 },
  { label: "NPR 2,500+", min: 2500, max: 999999 },
];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-brand-border bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">{title}</p>
      {children}
    </section>
  );
}

export function ShopFilterSidebar({ filters, onFilterChange, priceRange }: Props) {
  const category = CATEGORIES.find((item) => item.slug === filters.category);
  const reset = () => onFilterChange({ category: "", subCategory: "", brands: [], skinType: [], concerns: [], madeInNepal: false, search: "", minPrice: priceRange.min, maxPrice: priceRange.max, rating: 0, inStock: false, sort: "featured" });

  return (
    <aside className="space-y-4 rounded-[2rem] border border-brand-border bg-brand-surfaceCream p-4 shadow-[0_24px_80px_-60px_rgba(36,31,34,0.45)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Refine</p>
          <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Filters</h2>
        </div>
        <button type="button" onClick={reset} className="rounded-full bg-brand-primary-light px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary transition hover:bg-brand-primary hover:text-white">Reset</button>
      </div>

      <FilterSection title="Search">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-textMuted" />
          <input value={filters.search} onChange={(event) => onFilterChange({ ...filters, search: event.target.value })} placeholder="Serum, SPF, lipstick..." className="w-full rounded-2xl border border-brand-border bg-brand-bgLight py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-primary/30 focus:ring-2 focus:ring-brand-primary/20" />
        </label>
      </FilterSection>

      <FilterSection title="Category">
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <button key={cat.slug} type="button" onClick={() => onFilterChange({ ...filters, category: filters.category === cat.slug ? "" : cat.slug, subCategory: "" })} className={cn("flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition", filters.category === cat.slug ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textPrimary hover:text-brand-primary")}>
              {cat.name}<span className="text-xs opacity-60">{cat.subCategories.length}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {category ? (
        <FilterSection title="Product type">
          <div className="flex flex-wrap gap-2">
            {category.subCategories.map((subCategory) => (
              <button key={subCategory} type="button" onClick={() => onFilterChange({ ...filters, subCategory: filters.subCategory === subCategory ? "" : subCategory })} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", filters.subCategory === subCategory ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
                {subCategory}
              </button>
            ))}
          </div>
        </FilterSection>
      ) : null}

      <FilterSection title="Brand">
        <div className="max-h-56 space-y-2 overflow-auto pr-1">
          {BRANDS.map((brand) => (
            <label key={brand} className="min-h-[44px] cursor-pointer flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-textPrimary">
              <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => onFilterChange({ ...filters, brands: toggle(filters.brands, brand) })} className="h-4 w-4 rounded border-brand-border accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
              {brand}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Concern">
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((concern) => (
            <button key={concern} type="button" onClick={() => onFilterChange({ ...filters, concerns: toggle(filters.concerns, concern) })} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", filters.concerns.includes(concern) ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
              {concern}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Skin type">
        <div className="space-y-2">
          {SKIN_TYPES.map((skinType) => (
            <label key={skinType} className="min-h-[44px] cursor-pointer flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-textPrimary">
              <input type="checkbox" checked={filters.skinType.includes(skinType)} onChange={() => onFilterChange({ ...filters, skinType: toggle(filters.skinType, skinType) })} className="h-4 w-4 rounded border-brand-border accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
              {skinType}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-3">
          <label className="min-h-[44px] cursor-pointer flex items-center gap-2 text-sm font-bold text-brand-textPrimary"><input type="checkbox" checked={filters.madeInNepal} onChange={(event) => onFilterChange({ ...filters, madeInNepal: event.target.checked })} className="h-4 w-4 rounded border-brand-border accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" /> Made in Nepal only</label>
          <label className="min-h-[44px] cursor-pointer flex items-center gap-2 text-sm font-bold text-brand-textPrimary"><input type="checkbox" checked={filters.inStock} onChange={(event) => onFilterChange({ ...filters, inStock: event.target.checked })} className="h-4 w-4 rounded border-brand-border accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" /> In stock only</label>
        </div>
      </FilterSection>

      <FilterSection title="Price range">
        <div className="mb-3 grid gap-2">
          {quickPriceRanges.map((range) => {
            const cappedMax = Math.min(range.max, priceRange.max);
            const active = filters.minPrice === Math.max(priceRange.min, range.min) && filters.maxPrice === cappedMax;
            return (
              <button key={range.label} type="button" onClick={() => onFilterChange({ ...filters, minPrice: Math.max(priceRange.min, range.min), maxPrice: cappedMax })} className={cn("rounded-full px-3 py-2 text-left text-xs font-bold transition", active ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
                {range.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-brand-textMuted">
          <label className="space-y-1 font-bold">Min
            <input type="number" min={priceRange.min} max={filters.maxPrice} value={filters.minPrice} onChange={(event) => onFilterChange({ ...filters, minPrice: Number(event.target.value) })} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" />
          </label>
          <label className="space-y-1 font-bold">Max
            <input type="number" min={filters.minPrice} max={priceRange.max} value={filters.maxPrice} onChange={(event) => onFilterChange({ ...filters, maxPrice: Number(event.target.value) })} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" />
          </label>
        </div>
        <p className="mt-3 text-xs text-brand-textMuted">Showing NPR {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()}</p>
      </FilterSection>
    </aside>
  );
}
