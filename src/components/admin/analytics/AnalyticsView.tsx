"use client";

import { useMemo } from "react";
import { PRODUCTS } from "@/lib/data/products";

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-textPrimary">{label}</span>
        <span className="text-brand-textMuted">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-brand-bgLight">
        <div className="h-1.5 rounded-full bg-brand-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const categoryCounts = useMemo(
    () =>
      PRODUCTS.reduce<Record<string, number>>((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {}),
    [],
  );
  const maxCategoryCount = Math.max(...Object.values(categoryCounts));

  const topProducts = useMemo(
    () => [...PRODUCTS].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 5),
    [],
  );

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
      <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl font-semibold">Analytics</h2>
        <p className="mt-0.5 text-sm text-brand-textMuted">Operational view of categories and product attention.</p>
        <div className="mt-5 space-y-4">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <MiniBar key={category} label={category} value={count} max={maxCategoryCount} />
          ))}
        </div>
      </div>
      <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
        <h3 className="font-display text-xl font-semibold">Top viewed products</h3>
        <div className="mt-4 space-y-3">
          {topProducts.map((product) => (
            <MiniBar key={product.id} label={product.name} value={product.reviewsCount} max={topProducts[0]?.reviewsCount || 1} />
          ))}
        </div>
      </div>
    </section>
  );
}