"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { fetchRecommendations, getSessionId } from "@/lib/api/recommendations";
import type { Product } from "@/store/useCartStore";

interface ProductRecommendationStripProps {
  title: string;
  subtitle?: string;
  context: "home" | "product" | "cart" | "shop";
  productId?: string;
  limit?: number;
  showReasonLabels?: boolean;
}

export function ProductRecommendationStrip({
  title,
  subtitle,
  context,
  productId,
  limit = 8,
}: ProductRecommendationStripProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const userId: string | undefined = undefined;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const sessionId = getSessionId();
        const result = await fetchRecommendations({
          context,
          product_id: productId,
          session_id: sessionId,
          user_id: userId,
          limit,
        });
        if (!cancelled) setProducts(result);
      } catch {
        // Fallback is handled inside fetchRecommendations
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [context, productId, limit, userId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            {subtitle && (
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">
                {subtitle}
              </p>
            )}
            <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">
              {title}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white"
                >
                  <div className="aspect-[4/5] animate-pulse rounded-t-[1.35rem] bg-brand-bgLight" />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-brand-bgLight" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-brand-bgLight" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-brand-bgLight" />
                    <div className="mt-auto h-11 w-full animate-pulse rounded-full bg-brand-bgLight" />
                  </div>
                </div>
              ))
            : products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
        </div>
      </div>
    </section>
  );
}