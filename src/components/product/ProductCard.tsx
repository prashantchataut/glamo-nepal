"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Loader2, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/analytics";
import { cn, formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
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
  const toggleWishlistItem = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist);

  useEffect(() => setMounted(true), []);

  const isWishlisted = mounted ? isInWishlist(product.id) : false;
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const cardBadge = useMemo(() => {
    if (!product.inStock) return "soldOut" as const;
    if (product.isNewArrival) return "new" as const;
    if (product.badge === "Sale" || product.originalPrice)
      return "sale" as const;
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
    toast.success(`${product.name} added to bag`);
    trackEvent("add_to_cart", {
      productId: product.id,
      productSlug: product.slug,
      sku: product.sku,
      value: product.price,
    });
    window.setTimeout(() => setAddState("idle"), 650);
  }

  function onWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistItem(product);
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
      className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-card-default transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
    >
      <div className="relative block aspect-[4/5] overflow-hidden bg-brand-surfaceWarm">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Image
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            fill
            className={cn(
              "object-cover transition-transform duration-700 group-hover:scale-[1.045]",
              !product.inStock && "grayscale opacity-70",
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-950/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
        </Link>

        {(cardBadge || (discount > 0 && product.inStock)) && (
          <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
            {cardBadge && (
              <Badge variant={cardBadge}>
                {cardBadge === "soldOut"
                  ? "Sold out"
                  : cardBadge === "new"
                    ? "New"
                    : "Sale"}
              </Badge>
            )}
            {discount > 0 && product.inStock && (
              <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-950 ring-1 ring-white/80">
                -{discount}%
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onWishlist}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-neutral-700 shadow-soft transition-all duration-200 hover:text-primary",
            "opacity-100 md:opacity-0 md:group-hover:opacity-100",
            isWishlisted &&
              "bg-primary text-white opacity-100 hover:text-white",
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        {product.inStock && (
          <div className="absolute inset-x-3 bottom-3 z-10 translate-y-0 opacity-100 transition-all duration-300 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            {product.shadeOptions && product.shadeOptions.length > 0 ? (
              <Link
                href={`/products/${product.slug}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-soft transition-colors hover:bg-primary"
              >
                View options
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCart}
                disabled={addState === "loading"}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-soft transition-colors hover:bg-primary disabled:opacity-60"
              >
                {addState === "loading" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : addState === "added" ? (
                  <>
                    <Check size={14} /> Added
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} /> Quick add
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {product.brand}
          </p>
          <div
            className="flex items-center gap-1 text-[11px] text-neutral-500"
            aria-label={`${product.rating} out of 5 stars`}
          >
            <Star size={12} fill="currentColor" className="text-secondary" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <Link href={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="min-h-[2.8rem] font-display text-[1.35rem] font-semibold leading-[1.02] tracking-[-0.025em] text-neutral-950 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.concernTags.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs text-neutral-500">
            {product.concernTags.slice(0, 3).join(" · ")}
          </p>
        )}

        {product.shadeOptions && product.shadeOptions.length > 0 && (
          <div
            className="mt-3 flex items-center gap-1.5"
            aria-label="Available shades"
          >
            {product.shadeOptions.slice(0, 6).map((shade) => (
              <span
                key={shade.name}
                title={shade.name}
                className="h-3 w-3 rounded-full border border-neutral-200"
                style={{ backgroundColor: shade.hex || "var(--color-neutral-200)" }}
              />
            ))}
            {product.shadeOptions.length > 6 && (
              <span className="text-[10px] text-neutral-400">
                +{product.shadeOptions.length - 6}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold leading-none text-neutral-950">
                {formatNPR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatNPR(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-400">
              {product.reviewsCount} reviews
            </span>
          </div>
          {showNotify && !product.inStock && (
            <p className="mt-3 text-xs text-neutral-500">
              Notify request can be added from the product page.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white">
      <div className="aspect-[4/5] skeleton-shimmer" />
      <div className="space-y-3 px-5 py-5">
        <div className="h-3 w-16 skeleton-shimmer rounded-full" />
        <div className="h-5 w-4/5 skeleton-shimmer rounded-full" />
        <div className="h-4 w-1/3 skeleton-shimmer rounded-full" />
      </div>
    </div>
  );
}
