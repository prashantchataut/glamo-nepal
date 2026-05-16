"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompareStore } from "@/store/useCompareStore";
import type { Product } from "@/types/product";
import { formatNPR } from "@/lib/utils";

type CompareRow = {
  label: string;
  render: (product: Product) => string;
};

const rows: CompareRow[] = [
  { label: "Price", render: (p) => formatNPR(p.price) },
  { label: "Brand", render: (p) => p.brand },
  { label: "Category", render: (p) => p.category },
  { label: "Concern", render: (p) => p.concernTags.join(", ") },
  { label: "Size", render: (p) => p.size },
  { label: "Origin", render: (p) => p.origin },
  { label: "Made in Nepal", render: (p) => (p.madeInNepal ? "Yes" : "No") },
  { label: "Stock", render: (p) => `${p.stockCount} units` },
  { label: "Features", render: (p) => p.benefits.slice(0, 3).join(" · ") },
];

export function ComparePageClient() {
  const { items, removeItem, clear } = useCompareStore();

  return (
    <main className="bg-brand-bgLight py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Product comparison</p>
            <h1 className="mt-2 font-display text-5xl font-semibold text-brand-textPrimary">Compare GLAMO picks</h1>
            <p className="mt-2 text-brand-textMuted">Compare up to 3 products across price, brand, concern, size, origin, stock and features.</p>
          </div>
          {items.length > 0 ? (
            <button onClick={clear} className="rounded-none border border-brand-primary px-5 py-2 font-semibold text-brand-primary">
              Clear compare
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-none bg-cream-50 p-12 text-center shadow-sm">
            <h2 className="font-display text-3xl font-semibold">No products selected</h2>
            <p className="mt-2 text-brand-textMuted">Use compare buttons on product cards to add up to 3 products.</p>
            <Link href="/shop" className="mt-6 inline-flex rounded-none bg-brand-primary px-7 py-3 font-semibold text-white">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-none bg-cream-50 p-4 shadow-sm">
            <table className="w-full min-w-[760px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-44 p-4 text-left text-sm text-brand-textMuted">Product</th>
                  {items.map((product) => (
                    <th key={product.id} className="p-4 text-left align-top">
                      <div className="relative mb-3 h-40 overflow-hidden rounded-none bg-brand-bgLight">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                        <button onClick={() => removeItem(product.id)} className="absolute right-2 top-2 rounded-none bg-cream-50 p-2 text-brand-textMuted" aria-label={`Remove ${product.name} from compare`}>
                          <X size={14} />
                        </button>
                      </div>
                      <Link href={`/products/${product.slug}`} className="font-display text-xl font-semibold text-brand-textPrimary hover:text-brand-primary">
                        {product.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <td className="font-label border-t border-border p-4 text-sm font-bold uppercase tracking-[0.16em] text-brand-textMuted">{row.label}</td>
                    {items.map((product) => (
                      <td key={`${product.id}-${row.label}`} className="border-t border-border p-4 text-sm text-brand-textPrimary">
                        {row.render(product)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
