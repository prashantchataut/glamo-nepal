"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { useWishlistStore } from "@/store/useWishlistStore";

export function WishlistClient() {
  const items = useWishlistStore((state) => state.items);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Wishlist</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">Saved products</h1>
          <p className="mt-3 text-sm text-brand-textMuted">Wishlist products are saved on this device so you can return to favorites quickly.</p>
        </div>
        <Link href="/shop" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-bgDark">Browse shop</Link>
      </div>
      {items.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (<div className="mt-8"><EmptyState variant="wishlist" /></div>)}
    </div>
  );
}
