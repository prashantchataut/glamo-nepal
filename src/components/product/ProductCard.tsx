"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNpr } from "@/lib/utils";
import { useCartStore, type Product } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { trackEvent } from "@/lib/analytics";

export type { Product } from "@/store/useCartStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const addToCart = useCartStore((s) => s.addItem);
  const wishlist = useWishlistStore();

  useEffect(() => setMounted(true), []);

  const isWishlisted = mounted ? wishlist.isInWishlist(product.id) : false;
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  function onCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) {
      toast.error("This product is currently sold out.");
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart`);
    trackEvent("add_to_cart", { productId: product.id, productSlug: product.slug, sku: product.sku, value: product.price });
  }

  function onWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggleItem(product);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    trackEvent("wishlist_toggle", { productId: product.id, productSlug: product.slug, sku: product.sku, action: isWishlisted ? "remove" : "add" });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-black/6 bg-white shadow-[0_24px_60px_-48px_rgba(53,29,44,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_32px_80px_-48px_rgba(53,29,44,0.5)] focus-within:ring-2 focus-within:ring-brand-primary/20">
      <div className="relative">
        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
          {discount > 0 ? <span className="rounded-full bg-brand-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Save {discount}%</span> : null}
          {!product.inStock ? <span className="rounded-full bg-brand-textMuted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Sold out</span> : null}
        </div>
        <button
          type="button"
          onClick={onWishlist}
          className={cn(
            "absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
            isWishlisted
              ? "border-brand-primary bg-brand-primary text-white"
              : "border-black/8 bg-white/85 text-brand-textMuted hover:text-brand-primary"
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-[#FBF7F8]">
          <Image src={product.image} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-[1.04]" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-textMuted">{product.brand}</p>
          {product.madeInNepal ? <span className="text-[11px] font-medium text-brand-primary">Made in Nepal</span> : null}
        </div>

        <Link href={`/product/${product.slug}`} className="mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30">
          <h3 className="line-clamp-2 font-serif text-xl font-semibold leading-tight text-brand-textPrimary transition group-hover:text-brand-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-1 text-brand-gold" aria-label={`${product.rating} out of 5 stars`}>
          <Star size={14} fill="currentColor" className="text-brand-gold" />
          <span className="text-sm font-medium text-brand-textPrimary">{product.rating}</span>
          <span className="text-sm text-brand-textMuted">({product.reviewsCount})</span>
          {product.stockCount > 0 && product.stockCount <= 5 ? <span className="ml-auto text-xs font-medium text-amber-700">Only {product.stockCount} left</span> : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-black/6 pt-5">
          <div>
            <p className="text-xl font-semibold text-brand-textPrimary">{formatNpr(product.price)}</p>
            {product.originalPrice ? <p className="text-sm text-brand-textMuted line-through">{formatNpr(product.originalPrice)}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCart}
            disabled={!product.inStock}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
              product.inStock ? "bg-brand-primary text-white hover:bg-brand-bgDark" : "cursor-not-allowed bg-brand-bgLight text-brand-textMuted"
            )}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white">
      <div className="aspect-[4/5] skeleton-shimmer" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="h-6 w-4/5 rounded skeleton-shimmer" />
        <div className="h-4 w-2/3 rounded skeleton-shimmer" />
        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
          <div className="h-6 w-24 rounded skeleton-shimmer" />
          <div className="h-11 w-11 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
