"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShopFilterSidebar, type FilterState } from "./ShopFilterSidebar";

export function MobileFilterSheet({ open, onOpenChange, filters, onFilterChange, priceRange }: { open: boolean; onOpenChange: (open: boolean) => void; filters: FilterState; onFilterChange: (filters: FilterState) => void; priceRange: { min: number; max: number } }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[94vw] overflow-y-auto border-brand-border bg-brand-bgLight p-4 sm:max-w-md">
        <SheetHeader className="px-1 pt-2"><SheetTitle className="font-serif text-3xl text-brand-textPrimary">Refine GLAMO picks</SheetTitle></SheetHeader>
        <div className="mt-6"><ShopFilterSidebar filters={filters} onFilterChange={onFilterChange} priceRange={priceRange} /></div>
      </SheetContent>
    </Sheet>
  );
}
