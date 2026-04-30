"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompareStore } from "@/store/useCompareStore";
import { formatNpr } from "@/lib/utils";
import type { Product } from "@/store/useCartStore";

const rows: [string, (p: Product) => string][] = [
  ["Price", (p: Product) => formatNpr(p.price)],
  ["Brand", (p: Product) => p.brand],
  ["Category", (p: Product) => p.category],
  ["Concern", (p: Product) => p.concernTags.join(", ")],
  ["Size", (p: Product) => p.size],
  ["Origin", (p: Product) => p.origin],
  ["Made in Nepal", (p: Product) => p.madeInNepal ? "Yes" : "No"],
  ["Stock", (p: Product) => `${p.stockCount} units`],
  ["Features", (p: Product) => p.benefits.slice(0, 3).join(" · ")],
];

export function ComparePageClient() {
  const { items, removeItem, clear } = useCompareStore();

  if (items.length === 0) {
    return (
      <main className="bg-brand-bgLight py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mt-10 rounded-[2rem] bg-white p-12 text-center shadow-sm">
            <h2 className="font-serif text-3xl font-semibold">No products selected</h2>
            <p className="mt-2 text-brand-textMuted">
              Use compare buttons on product cards to add up to 3 products.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-brand-primary px-7 py-3 font-semibold text-white"
            >
              Browse products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-bgLight py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Product comparison</p>
            <h1 className="mt-2 font-serif text-5xl font-semibold text-brand-textPrimary">Compare GLAMO picks</h1>
            <p className="mt-2 text-brand-textMuted">Compare up to 3 products across price, brand, concern, size, origin, stock and features.</p>
          </div>
          {items.length > 0 && (
            <button onClick={clear} className="rounded-full border border-brand-primary px-5 py-2 font-semibold text-brand-primary">
              Clear compare
            </button>
          )}
        </div>

        <div className="mt-10 overflow-x-auto rounded-[2rem] bg-white p-4 shadow-sm">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-44 p-4 text-left text-sm text-brand-textMuted">Product</th>
                {items.map((p) => (
                  <th key={p.id} className="p-4 text-left align-top">
                    <div className="relative mb-3 h-40 overflow-hidden rounded-2xl bg-brand-bgLight">
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="200px" />
                      <button
                        onClick={() => removeItem(p.id)}
                        className="absolute right-2 top-2 rounded-full bg-white p-2 text-brand-textMuted"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <Link
                      href={`/product/${p.slug}`}
                      className="font-serif text-xl font-semibold text-brand-textPrimary hover:text-brand-primary"
                    >
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, fn]) => (
                <tr key={label} className="border-t border-border">
                  <td className="border-t border-b border-border p-4 text-sm font-semibold text-brand-textMuted">{label}</td>
                  {items.map((p) => (
                    <td key={`${p.id}-${label}`} className="border-t border-b border-border p-4 text-sm text-brand-textPrimary">
                      {fn(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}