"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Check, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { cn, formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

type AddState = "idle" | "loading" | "added";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const [addState, setAddState] = useState<AddState>("idle");
  const [showNotify, setShowNotify] = useState(false);
  const addToCart = useCartStore((s) => s.addItem);
  const wishlist = useWishlistStore();

  useEffect(() => setMounted(true), []);

  const isWishlisted = mounted ? wishlist.isInWishlist(product.id) : false;
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) *
          100
      )
    : 0;

  const cardBadge = useMemo(() => {
    if (!product.inStock) return "soldOut" as const;
    if (product.isNewArrival) return "new" as const;
    if (product.badge === "Sale" || product.originalPrice) return "sale" as const;
    return null;
  }, [product]);

  function onCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) {
      setShowNotify(true);
      return;
    }
    setAddState("loading");
    const result = addToCart(product);
    if (!result.ok) {
      setAddState("idle");
      toast.error(result.message || "Unable to add this item.");
      return;
    }
    setAddState("added");
    window.dispatchEvent(new CustomEvent("glamo:cart-pulse"));
    toast.success(`${product.name} added to cart`);
    trackEvent("add_to_cart", {
      productId: product.id,
      productSlug: product.slug,
      sku: product.sku,
      value: product.price,
    });
    window.requestAnimationFrame(() => setAddState("idle"));
  }

  function onWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggleItem(product);
    trackEvent("wishlist_toggle", {
      productId: product.id,
      productSlug: product.slug,
      sku: product.sku,
      action: isWishlisted ? "remove" : "add",
    });
  }

  return (
    <article
      aria-label={product.name}
      className="group flex h-full flex-col border border-neutral-200 bg-white transition-colors hover:border-primary/30"
    >
      {/* Image container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[#f7f1ec] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Image
          src={product.image}
          alt={`${product.brand} ${product.name}`}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-[1.04]",
            !product.inStock && "grayscale opacity-70"
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />

        {/* Badges */}
        {(cardBadge || (discount > 0 && product.inStock)) && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            {cardBadge && (
              <Badge variant={cardBadge}>
                {cardBadge === "soldOut"
                  ? "SOLD OUT"
                  : cardBadge === "new"
                  ? "NEW"
                  : cardBadge === "sale"
                  ? "SALE"
                  : ""}
              </Badge>
            )}
            {discount > 0 && product.inStock && (
              <span className="bg-secondary text-white text-[10px] tracking-widest uppercase px-2 py-0.5 font-medium">
                -{discount}%
              </span>
            )}
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={onWishlist}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center border border-neutral-200 transition-all duration-200",
            "bg-white/95 opacity-100 md:opacity-0 md:group-hover:opacity-100",
            isWishlisted && "opacity-100",
            isWishlisted
              ? "bg-primary text-white"
              : "bg-surface/90 text-neutral-700 hover:text-primary"
          )}
          aria-label={
            isWishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
        >
          <Heart
            size={16}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>

        {/* Quick Add overlay */}
        {product.inStock && (
          <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={onCart}
              disabled={addState === "loading"}
              className="flex h-12 w-full items-center justify-center gap-2 bg-neutral-900 text-white text-[11px] tracking-[0.16em] uppercase font-semibold transition-colors hover:bg-primary disabled:opacity-50"
            >
              {addState === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : addState === "added" ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <ShoppingBag size={14} /> Quick Add
                </>
              )}
            </button>
          </div>
        )}
      </Link>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
        {/* Brand */}
        <p className="type-label text-[10px] text-neutral-500 mb-1">
          {product.brand}
        </p>

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="min-h-[2.65rem] font-display text-lg leading-tight text-neutral-900 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {/* Shade swatches */}
        {product.shadeOptions && product.shadeOptions.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5" aria-label="Available shades">
            {product.shadeOptions.slice(0, 5).map((shade) => (
              <span
                key={shade.name}
                title={shade.name}
                className="h-2 w-2 rounded-full border border-neutral-200"
                style={{ backgroundColor: shade.hex || "#E8E4DF" }}
              />
            ))}
            {product.shadeOptions.length > 5 && (
              <span className="text-[10px] text-neutral-400">
                +{product.shadeOptions.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="type-price text-neutral-900">
            {formatNPR(product.price)}
          </span>
          {product.originalPrice && (
            <span className="font-body text-sm text-neutral-400 line-through">
              {formatNPR(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex items-center" aria-label={`${product.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < Math.round(product.rating) ? "currentColor" : "none"}
                className={
                  i < Math.round(product.rating) ? "text-secondary" : "text-neutral-300"
                }
              />
            ))}
          </div>
          <span className="font-body text-[11px] text-neutral-400">
            ({product.reviewsCount})
          </span>
        </div>

        {/* Notify form for out of stock */}
        {showNotify && !product.inStock && (
          <div className="mt-3">
            <p className="type-body-sm text-neutral-400">
              Notify me when available
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="aspect-[3/4] skeleton-shimmer" />
      <div className="pt-3 pb-4 px-0 space-y-2">
        <div className="h-3 w-16 skeleton-shimmer" />
        <div className="h-5 w-3/4 skeleton-shimmer" />
        <div className="h-4 w-1/3 skeleton-shimmer" />
      </div>
    </div>
  );
}