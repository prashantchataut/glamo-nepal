"use client";

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

export function ShopFilterSidebar({ filters, onFilterChange, priceRange }: Props) {
  const category = CATEGORIES.find((item) => item.slug === filters.category);
  const reset = () => onFilterChange({ category: "", subCategory: "", brands: [], skinType: [], concerns: [], madeInNepal: false, search: "", minPrice: priceRange.min, maxPrice: priceRange.max, rating: 0, inStock: false, sort: "featured" });

  return (
    <aside className="space-y-6 rounded-[2rem] border border-brand-secondary/20 bg-white p-5 shadow-sm lg:sticky lg:top-[calc(var(--total-header-height)+16px)] lg:h-[calc(100vh-var(--total-header-height)-32px)] lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Filters</h2>
        <button type="button" onClick={reset} className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Reset</button>
      </div>

      <label className="block space-y-2 text-sm font-semibold text-brand-textPrimary">
        Search
        <input value={filters.search} onChange={(event) => onFilterChange({ ...filters, search: event.target.value })} placeholder="Serum, SPF, lipstick..." className="w-full rounded-xl border border-border bg-brand-bgLight px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" />
      </label>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-textMuted">Category</p>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <button key={cat.slug} type="button" onClick={() => onFilterChange({ ...filters, category: filters.category === cat.slug ? "" : cat.slug, subCategory: "" })} className={cn("w-full rounded-xl px-4 py-2 text-left text-sm transition", filters.category === cat.slug ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {category ? (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-textMuted">Type</p>
          <div className="flex flex-wrap gap-2">
            {category.subCategories.map((subCategory) => (
              <button key={subCategory} type="button" onClick={() => onFilterChange({ ...filters, subCategory: filters.subCategory === subCategory ? "" : subCategory })} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", filters.subCategory === subCategory ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
                {subCategory}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-textMuted">Brand</p>
        <div className="max-h-52 space-y-2 overflow-auto pr-1">
          {BRANDS.map((brand) => (
            <label key={brand} className="flex items-center gap-2 text-sm text-brand-textMuted">
              <input type="checkbox" checked={filters.brands.includes(brand)} onChange={() => onFilterChange({ ...filters, brands: toggle(filters.brands, brand) })} className="h-4 w-4 rounded border-border text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-textMuted">Concern</p>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((concern) => (
            <button key={concern} type="button" onClick={() => onFilterChange({ ...filters, concerns: toggle(filters.concerns, concern) })} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", filters.concerns.includes(concern) ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
              {concern}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-textMuted">Skin type</p>
        <div className="space-y-2">
          {SKIN_TYPES.map((skinType) => (
            <label key={skinType} className="flex items-center gap-2 text-sm text-brand-textMuted">
              <input type="checkbox" checked={filters.skinType.includes(skinType)} onChange={() => onFilterChange({ ...filters, skinType: toggle(filters.skinType, skinType) })} className="h-4 w-4 rounded border-border text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
              {skinType}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-textPrimary"><input type="checkbox" checked={filters.madeInNepal} onChange={(event) => onFilterChange({ ...filters, madeInNepal: event.target.checked })} className="h-4 w-4 rounded border-border text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" /> Made in Nepal only</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-textPrimary"><input type="checkbox" checked={filters.inStock} onChange={(event) => onFilterChange({ ...filters, inStock: event.target.checked })} className="h-4 w-4 rounded border-border text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" /> In stock only</label>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-textMuted">Price range</p>
        <div className="mb-3 grid gap-2">
          {quickPriceRanges.map((range) => {
            const cappedMax = Math.min(range.max, priceRange.max);
            const active = filters.minPrice === Math.max(priceRange.min, range.min) && filters.maxPrice === cappedMax;
            return (
              <button key={range.label} type="button" onClick={() => onFilterChange({ ...filters, minPrice: Math.max(priceRange.min, range.min), maxPrice: cappedMax })} className={cn("rounded-full px-3 py-2 text-left text-xs font-semibold transition", active ? "bg-brand-primary text-white" : "bg-brand-bgLight text-brand-textMuted hover:text-brand-primary")}>
                {range.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-brand-textMuted">
          <label className="space-y-1 font-semibold">Min
            <input type="number" min={priceRange.min} max={filters.maxPrice} value={filters.minPrice} onChange={(event) => onFilterChange({ ...filters, minPrice: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-brand-bgLight px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" />
          </label>
          <label className="space-y-1 font-semibold">Max
            <input type="number" min={filters.minPrice} max={priceRange.max} value={filters.maxPrice} onChange={(event) => onFilterChange({ ...filters, maxPrice: Number(event.target.value) })} className="w-full rounded-xl border border-border bg-brand-bgLight px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" />
          </label>
        </div>
        <p className="mt-3 text-xs text-brand-textMuted">Showing NPR {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()}</p>
      </div>
    </aside>
  );
}