"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { cn, formatNPR } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const wishlist = useWishlistStore();

  useEffect(() => setMounted(true), []);

  const isWishlisted = mounted ? wishlist.isInWishlist(product.id) : false;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const cardBadge = useMemo(() => {
    if (!product.inStock) return "SOLD OUT";
    if (product.isNewArrival || product.badge === "New") return "NEW";
    if (discount > 0 || product.badge === "Sale") return `SALE ${discount || ""}%`.trim();
    return null;
  }, [product, discount]);

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
    <article aria-label={product.name} className="group flex h-full flex-col transition duration-500 hover:-translate-y-1">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-4"
      >
        <Image
          src={product.image}
          alt={`${product.brand} ${product.name}`}
          fill
          className={cn(
            "object-cover object-center transition duration-[400ms] ease-out group-hover:scale-[1.03]",
            !product.inStock && "grayscale opacity-65",
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />

        <button
          type="button"
          onClick={onWishlist}
          className={cn(
            "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-cream-50 text-ink opacity-100 shadow-[0_12px_30px_-22px_rgba(26,15,11,0.5)] transition duration-300 hover:text-brand-rose md:opacity-0 md:group-hover:opacity-100",
            isWishlisted && "text-brand-rose opacity-100",
          )}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>

        {cardBadge && (
          <span className="absolute bottom-3 left-3 z-10 bg-cream-50 px-3 py-1.5 text-label-sm font-semibold uppercase tracking-[0.15em] text-brand-deep">
            {cardBadge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cream-400 sm:text-[10px]">
          {product.brand}
        </p>

        <Link href={`/products/${product.slug}`} className="mt-1 block">
          <h3 className="line-clamp-2 min-h-[2.6rem] font-display text-[1.06rem] font-medium leading-snug text-ink transition-colors group-hover:text-brand-deep sm:text-[1.15rem]">
            {product.name}
          </h3>
        </Link>

        {product.shadeOptions && product.shadeOptions.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5" aria-label="Available shades">
            <span className="mr-1 text-[11px] text-cream-400">Shade:</span>
            {product.shadeOptions.slice(0, 5).map((shade) => (
              <span
                key={shade.name}
                title={shade.name}
                className="h-3 w-3 rounded-none border border-cream-200"
                style={{ backgroundColor: shade.hex || "#F0E8E3" }}
              />
            ))}
            {product.shadeOptions.length > 5 && <span className="text-[10px] text-cream-400">+{product.shadeOptions.length - 5}</span>}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={cn("font-display text-price-md font-medium leading-none", discount > 0 ? "text-brand-deep" : "text-ink")}>
              {formatNPR(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xs text-cream-400 line-through">{formatNPR(product.originalPrice)}</span>
                {discount > 0 && <span className="text-[11px] font-semibold text-brand-rose">({discount}% off)</span>}
              </>
            )}
          </div>
          {product.reviewsCount > 0 && (
            <div className="mt-3 flex items-center gap-1 text-[11px] text-cream-700" aria-label={`${product.rating} out of 5 stars`}>
              <Star size={12} fill="currentColor" className="text-gold" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-cream-400">({product.reviewsCount})</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="aspect-[4/5] skeleton-shimmer" />
      <div className="space-y-3 py-4">
        <div className="h-3 w-16 skeleton-shimmer" />
        <div className="h-5 w-4/5 skeleton-shimmer" />
        <div className="h-4 w-1/3 skeleton-shimmer" />
      </div>
    </div>
  );
}
