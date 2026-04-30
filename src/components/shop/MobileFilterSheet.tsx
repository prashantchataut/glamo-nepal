"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShopFilterSidebar, type FilterState } from "./ShopFilterSidebar";

export function MobileFilterSheet({ open, onOpenChange, filters, onFilterChange, priceRange }: { open: boolean; onOpenChange: (open: boolean) => void; filters: FilterState; onFilterChange: (filters: FilterState) => void; priceRange: { min: number; max: number } }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[92vw] overflow-y-auto bg-brand-bgLight sm:max-w-md">
        <SheetHeader><SheetTitle className="font-serif text-2xl">Refine GLAMO picks</SheetTitle></SheetHeader>
        <div className="mt-6"><ShopFilterSidebar filters={filters} onFilterChange={onFilterChange} priceRange={priceRange} /></div>
      </SheetContent>
    </Sheet>
  );
}
