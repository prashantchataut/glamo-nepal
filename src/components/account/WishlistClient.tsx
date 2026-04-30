"use client";

import Link from "next/link";
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
          <p className="mt-3 text-sm text-brand-textMuted">Wishlist products are persisted locally until a backend account wishlist is connected.</p>
        </div>
        <Link href="/shop" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-bgDark">Browse shop</Link>
      </div>
      {items.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 md:gap-6">
          {items.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-dashed border-brand-secondary/50 bg-white p-10 text-center shadow-sm">
          <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Your wishlist is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-textMuted">Tap the heart icon on products to save them here. Backend account sync can be added later.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-bgDark">Find beauty picks</Link>
        </div>
      )}
    </div>
  );
}
