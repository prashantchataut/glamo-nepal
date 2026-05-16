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
    <div className="border-b border-cream-200 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
      <p className="type-label text-[11px] text-cream-400 mb-3">{title}</p>
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
    <aside className="rounded-none border border-cream-200 bg-cream-50 p-5 shadow-soft lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="type-heading-sm text-ink">Filters</h2>
        <button
          type="button"
          onClick={reset}
          className="type-label text-[11px] text-brand-rose hover:text-brand-rose-dark transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <FilterSection title="Search">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
          <input
            value={filters.search}
            onChange={(event) =>
              onFilterChange({ ...filters, search: event.target.value })
            }
            placeholder="Serum, SPF, lipstick..."
            className="w-full rounded-none border border-cream-200 bg-cream-50 py-3 pl-9 pr-4 text-sm text-ink placeholder:text-cream-400 focus:border-brand-rose focus:outline-none"
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
                "flex w-full items-center justify-between rounded-none px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                filters.category === cat.slug
                  ? "bg-brand-rose text-white"
                  : "text-cream-700 hover:bg-cream-100"
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
                  "rounded-none px-3 py-1.5 text-xs tracking-wide transition-colors cursor-pointer",
                  filters.subCategory === subCategory
                    ? "bg-brand-rose text-white"
                    : "bg-cream-100 text-cream-700 hover:text-brand-rose"
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
              className="flex cursor-pointer items-center gap-3 px-2 py-2 text-sm text-cream-700 transition-colors hover:text-brand-rose"
            >
              <input
                type="checkbox"
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
              className="flex cursor-pointer items-center gap-3 px-2 py-2 text-sm text-cream-700 transition-colors hover:text-brand-rose"
            >
              <input
                type="checkbox"
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
                "rounded-none px-3 py-1.5 text-xs tracking-wide transition-colors cursor-pointer",
                filters.concerns.includes(concern)
                  ? "bg-brand-rose text-white"
                  : "bg-cream-100 text-cream-700 hover:text-brand-rose"
              )}
            >
              {concern}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-cream-700">
            <input
              type="checkbox"
              checked={filters.madeInNepal}
              onChange={(event) =>
                onFilterChange({ ...filters, madeInNepal: event.target.checked })
              }
              className="h-4 w-4 accent-primary"
            />
            Made in Nepal only
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-cream-700">
            <input
              type="checkbox"
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
            <label className="space-y-1">
              <span className="type-label text-[10px] text-cream-400">Min</span>
              <input
                type="number"
                min={priceRange.min}
                max={filters.maxPrice}
                value={filters.minPrice}
                onChange={(event) =>
                  onFilterChange({
                    ...filters,
                    minPrice: Number(event.target.value),
                  })
                }
                className="w-full rounded-none border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink focus:border-brand-rose focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="type-label text-[10px] text-cream-400">Max</span>
              <input
                type="number"
                min={filters.minPrice}
                max={priceRange.max}
                value={filters.maxPrice}
                onChange={(event) =>
                  onFilterChange({
                    ...filters,
                    maxPrice: Number(event.target.value),
                  })
                }
                className="w-full rounded-none border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-ink focus:border-brand-rose focus:outline-none"
              />
            </label>
          </div>
          <p className="text-xs text-cream-400">
            Showing रू {filters.minPrice.toLocaleString()} – रू{" "}
            {filters.maxPrice.toLocaleString()}
          </p>
        </div>
      </FilterSection>
    </aside>
  );
}