"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface UrgencyBadgeProps {
  product: Product & { _fastMoving?: boolean };
  className?: string;
}

export function UrgencyBadge({ product, className }: UrgencyBadgeProps) {
  const isLowStock = product.inStock && product.stockCount > 0 && product.stockCount <= 5;
  const isFastMoving = product._fastMoving === true;

  if (!isLowStock && !isFastMoving) return null;

  return (
    <span
      className={cn(
        "font-label rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm",
        isFastMoving
          ? "bg-teal-100 text-teal-800"
          : "bg-amber-100 text-amber-800",
        className
      )}
    >
      {isFastMoving ? "Fast moving" : `Only ${product.stockCount} left`}
    </span>
  );
}