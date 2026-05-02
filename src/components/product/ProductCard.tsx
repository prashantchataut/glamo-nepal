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
  const badge = !product.inStock ? "Sold out" : product.badge || (product.isBestSeller ? "Best Seller" : product.isNewArrival ? "New" : "");

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
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-brand-border bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-primary/25 hover:shadow-card-hover focus-within:ring-2 focus-within:ring-brand-primary/20">
      <div className="relative p-3 pb-0">
        <div className="absolute left-5 top-5 z-10 flex max-w-[70%] flex-wrap gap-2">
          {badge ? <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm", !product.inStock ? "bg-brand-textMuted" : "bg-brand-primary")}>{badge}</span> : null}
          {discount > 0 ? <span className="rounded-full bg-brand-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-bgDark shadow-sm">Save {discount}%</span> : null}
        </div>
        <button
          type="button"
          onClick={onWishlist}
          className={cn(
            "absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
            isWishlisted ? "border-brand-primary bg-brand-primary text-white" : "border-white/70 bg-white/86 text-brand-textMuted hover:text-brand-primary",
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-brand-bgLight">
          <Image src={product.image} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-[1.045]" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">{product.brand}</p>
          {product.madeInNepal ? <span className="shrink-0 rounded-full bg-brand-primary-light px-2.5 py-1 text-[10px] font-bold text-brand-primary">Made in Nepal</span> : null}
        </div>

        <Link href={`/product/${product.slug}`} className="mt-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30">
          <h3 className="line-clamp-2 font-serif text-[1.35rem] font-semibold leading-[1.05] text-brand-textPrimary transition group-hover:text-brand-primary">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-textMuted">{product.description}</p>

        <div className="mt-3 flex items-center gap-1 text-brand-gold" aria-label={`${product.rating} out of 5 stars`}>
          <Star size={14} fill="currentColor" className="text-brand-gold" />
          <span className="text-sm font-bold text-brand-textPrimary">{product.rating}</span>
          <span className="text-sm text-brand-textMuted">({product.reviewsCount})</span>
          {product.stockCount > 0 && product.stockCount <= 5 ? <span className="ml-auto text-xs font-bold text-amber-700">Only {product.stockCount} left</span> : null}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-brand-border pt-4">
          <div className="min-w-0">
            <p className="text-lg font-bold text-brand-textPrimary">{formatNpr(product.price)}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {product.originalPrice ? <p className="text-sm text-brand-textMuted line-through">{formatNpr(product.originalPrice)}</p> : null}
              <p className="text-xs font-semibold text-brand-textMuted">{product.size}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCart}
          disabled={!product.inStock}
          className={cn(
            "mt-4 inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
            product.inStock ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/15 hover:bg-brand-primary-hover" : "cursor-not-allowed bg-brand-bgLight text-brand-textMuted",
          )}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingBag size={17} /> {product.inStock ? "Quick add" : "Sold out"}
        </button>
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
        <div className="mt-auto h-11 w-full rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}
