"use client";

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
          <p className="type-label text-xs font-bold uppercase tracking-[0.22em] text-secondary">Wishlist</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-neutral-900 md:text-4xl lg:text-5xl">Saved products</h1>
          <p className="mt-3 text-sm text-neutral-500">Wishlist products are saved on this device so you can return to favorites quickly.</p>
        </div>
        <Link href="/shop" className="cursor-pointer bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark">
          Browse shop
        </Link>
      </div>
      {items.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (<div className="mt-8"><EmptyState variant="wishlist" /></div>)}
    </div>
  );
}