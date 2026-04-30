"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GitCompareArrows, Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNpr } from "@/lib/utils";
import { useCartStore, type Product } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCompareStore } from "@/store/useCompareStore";
import { trackEvent } from "@/lib/analytics";

export type { Product } from "@/store/useCartStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const addToCart = useCartStore((s) => s.addItem);
  const wishlist = useWishlistStore();
  const compare = useCompareStore();

  useEffect(() => setMounted(true), []);

  const isWishlisted = mounted ? wishlist.isInWishlist(product.id) : false;
  const isCompared = mounted ? compare.isInCompare(product.id) : false;
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

  function onCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      compare.removeItem(product.id);
      toast.info("Removed from compare");
      trackEvent("compare_toggle", { productId: product.id, productSlug: product.slug, action: "remove" });
      return;
    }
    const ok = compare.addItem(product);
    if (ok) { toast.success("Added to compare"); } else { toast.error("Compare supports up to 3 products"); }
    trackEvent("compare_toggle", { productId: product.id, productSlug: product.slug, action: ok ? "add" : "limit_reached" });
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-brand-secondary/20 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_70px_-28px_rgba(139,58,143,0.35)] focus-within:ring-2 focus-within:ring-brand-primary/30">
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
        {product.badge && <span className="rounded-full bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{product.badge}</span>}
        {discount > 0 && <span className="rounded-full bg-brand-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-bgDark">Save {discount}%</span>}
        {product.madeInNepal && <span className="rounded-full bg-brand-bgDark px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Made in Nepal</span>}
        {!product.inStock && <span className="rounded-full bg-brand-textMuted px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Sold out</span>}
      </div>

      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 opacity-100 md:opacity-0 md:translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        <button type="button" onClick={onWishlist} className={cn("rounded-full p-2 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-brand-primary", isWishlisted ? "bg-brand-primary text-white" : "bg-white/85 text-brand-textMuted hover:text-brand-primary")} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}>
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        <button type="button" onClick={onCompare} className={cn("rounded-full p-2 shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-brand-primary", isCompared ? "bg-brand-gold text-brand-bgDark" : "bg-white/85 text-brand-textMuted hover:text-brand-primary")} aria-label={isCompared ? "Remove from compare" : "Add to compare"}>
          <GitCompareArrows size={16} />
        </button>
      </div>

      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-brand-bgLight">
        <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" />
        <div className="absolute inset-x-4 bottom-4 translate-y-3 rounded-full bg-white/92 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-brand-primary opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">View details</div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-textMuted">{product.brand}</span>
          <span className={cn("text-[10px] font-semibold", product.stockCount > 10 ? "text-emerald-700" : product.stockCount > 0 ? "text-amber-700" : "text-brand-textMuted")}>{product.stockCount > 10 ? "In stock" : product.stockCount > 0 ? `${product.stockCount} left` : "Out"}</span>
        </div>
        <Link href={`/product/${product.slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40">
          <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-tight text-brand-textPrimary transition-colors group-hover:text-brand-primary">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brand-textMuted">{product.description}</p>
        <div className="mt-3 flex items-center gap-1 text-brand-gold" aria-label={`${product.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill={i < Math.round(product.rating) ? "currentColor" : "none"} className={i < Math.round(product.rating) ? "text-brand-gold" : "text-brand-textMuted/30"} />)}
          <span className="ml-1 text-[11px] text-brand-textMuted">{product.rating} ({product.reviewsCount})</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/50 pt-4">
          <div>
            <div className="text-lg font-bold text-brand-gold">{formatNpr(product.price)}</div>
            {product.originalPrice && <div className="text-xs text-brand-textMuted line-through">{formatNpr(product.originalPrice)}</div>}
          </div>
          <button type="button" onClick={onCart} disabled={!product.inStock} className={cn("flex h-11 w-11 items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary", product.inStock ? "bg-brand-primary text-white hover:bg-brand-bgDark hover:scale-105" : "cursor-not-allowed bg-brand-bgLight text-brand-textMuted")} aria-label={`Add ${product.name} to cart`}>
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white">
      <div className="aspect-[4/5] skeleton-shimmer" />
      <div className="flex flex-1 flex-col gap-3 p-4">
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
