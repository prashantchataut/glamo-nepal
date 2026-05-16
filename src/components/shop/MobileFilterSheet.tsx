"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShopFilterSidebar, type FilterState } from "./ShopFilterSidebar";

export function MobileFilterSheet({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  priceRange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  priceRange: { min: number; max: number };
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[86svh] overflow-y-auto rounded-t-[28px] border-cream-200 bg-cream-50 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6 lg:hidden"
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-cream-300" aria-hidden="true" />
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-3xl font-light tracking-[-0.04em] text-ink">
            Filter the edit
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <ShopFilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            priceRange={priceRange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
