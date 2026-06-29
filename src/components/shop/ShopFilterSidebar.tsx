"use client";

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

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-neutral-200 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
      <p className="type-label text-xs text-neutral-500 mb-3">{title}</p>
      {children}
    </div>
  );
}

export function ShopFilterSidebar({ filters, onFilterChange, priceRange }: Props) {
  const category = CATEGORIES.find((item) => item.slug === filters.category);
  const reset = () =>
    onFilterChange({
      category: "",
      subCategory: "",
      brands: [],
      skinType: [],
      concerns: [],
      madeInNepal: false,
      search: "",
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      rating: 0,
      inStock: false,
      sort: "featured",
    });

  return (
    <aside className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-soft lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="type-heading-sm text-neutral-900">Filters</h2>
        <button
          type="button"
          onClick={reset}
          className="type-label text-xs text-primary hover:text-primary-dark transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <FilterSection title="Search">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={filters.search}
            onChange={(event) =>
              onFilterChange({ ...filters, search: event.target.value })
            }
            placeholder="Serum, SPF, lipstick..."
            className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
          />
        </label>
      </FilterSection>

      <FilterSection title="Category">
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  category: filters.category === cat.slug ? "" : cat.slug,
                  subCategory: "",
                })
              }
              className={cn(
                "flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                filters.category === cat.slug
                  ? "bg-primary text-neutral-50"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {cat.name}
              <span className="text-xs opacity-60">{cat.subCategories.length}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {category && (
        <FilterSection title="Product Type">
          <div className="flex flex-wrap gap-2">
            {category.subCategories.map((subCategory) => (
              <button
                key={subCategory}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    subCategory:
                      filters.subCategory === subCategory ? "" : subCategory,
                  })
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs tracking-wide transition-colors cursor-pointer",
                  filters.subCategory === subCategory
                    ? "bg-primary text-neutral-50"
                    : "bg-neutral-50 text-neutral-600 hover:text-primary"
                )}
              >
                {subCategory}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Brand">
        <div className="max-h-48 space-y-1 overflow-auto">
          {BRANDS.map((brand) => (
<label
               key={brand}
               htmlFor={`brand-${brand}`}
               className="flex cursor-pointer items-center gap-3 px-2 py-2 text-sm text-neutral-700 transition-colors hover:text-primary"
             >
               <input
                 type="checkbox"
                 id={`brand-${brand}`}
                 checked={filters.brands.includes(brand)}
                 onChange={() =>
                   onFilterChange({
                     ...filters,
                     brands: toggle(filters.brands, brand),
                   })
                 }
                 className="h-4 w-4 accent-primary"
               />
              {brand}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Skin Type">
        <div className="space-y-1">
          {SKIN_TYPES.map((skinType) => (
<label
               key={skinType}
               htmlFor={`skin-type-${skinType}`}
               className="flex cursor-pointer items-center gap-3 px-2 py-2 text-sm text-neutral-700 transition-colors hover:text-primary"
             >
               <input
                 type="checkbox"
                 id={`skin-type-${skinType}`}
                 checked={filters.skinType.includes(skinType)}
                 onChange={() =>
                   onFilterChange({
                     ...filters,
                     skinType: toggle(filters.skinType, skinType),
                   })
                 }
                 className="h-4 w-4 accent-primary"
               />
              {skinType}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Concern">
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((concern) => (
            <button
              key={concern}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  concerns: toggle(filters.concerns, concern),
                })
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs tracking-wide transition-colors cursor-pointer",
                filters.concerns.includes(concern)
                  ? "bg-primary text-neutral-50"
                  : "bg-neutral-50 text-neutral-600 hover:text-primary"
              )}
            >
              {concern}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-3">
          <label htmlFor="filter-made-in-nepal" className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              id="filter-made-in-nepal"
              checked={filters.madeInNepal}
              onChange={(event) =>
                onFilterChange({ ...filters, madeInNepal: event.target.checked })
              }
              className="h-4 w-4 accent-primary"
            />
            Made in Nepal only
          </label>
          <label htmlFor="filter-in-stock" className="flex cursor-pointer items-center gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              id="filter-in-stock"
              checked={filters.inStock}
              onChange={(event) =>
                onFilterChange({ ...filters, inStock: event.target.checked })
              }
              className="h-4 w-4 accent-primary"
            />
            In stock only
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor="filter-min-price" className="space-y-1">
              <span className="type-label text-xs text-neutral-500">Min</span>
              <input
                type="number"
                id="filter-min-price"
                aria-label="Minimum price"
                min={priceRange.min}
                max={filters.maxPrice}
                value={filters.minPrice}
                onChange={(event) =>
                  onFilterChange({
                    ...filters,
                    minPrice: Number(event.target.value),
                  })
                }
                className="w-full rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary focus:outline-none"
              />
            </label>
            <label htmlFor="filter-max-price" className="space-y-1">
              <span className="type-label text-xs text-neutral-500">Max</span>
              <input
                type="number"
                id="filter-max-price"
                aria-label="Maximum price"
                min={filters.minPrice}
                max={priceRange.max}
                value={filters.maxPrice}
                onChange={(event) =>
                  onFilterChange({
                    ...filters,
                    maxPrice: Number(event.target.value),
                  })
                }
                className="w-full rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            Showing ?? {filters.minPrice.toLocaleString()} � ??{" "}
            {filters.maxPrice.toLocaleString()}
          </p>
        </div>
      </FilterSection>
    </aside>
  );
}