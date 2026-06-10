"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompareStore } from "@/store/useCompareStore";
import { formatNPR } from "@/lib/utils";

export function CompareTray() {
  const { items, removeItem, clear } = useCompareStore();
  if (!items.length) return null;
  return (
    <div className="fixed inset-x-4 bottom-20 z-card mx-auto max-w-3xl rounded-3xl border border-brand-secondary/30 bg-white/95 p-3 shadow-2xl md:bottom-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {items.map((product) => (
            <div key={product.id} className="flex min-w-0 items-center gap-2 rounded-2xl bg-neutral-50 p-2 pr-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white"><Image src={product.image} alt={product.name} fill className="object-cover" /></div>
              <div className="min-w-[120px]">
                <p className="line-clamp-1 text-xs font-semibold text-neutral-900">{product.name}</p>
                <p className="text-[11px] text-secondary">{formatNPR(product.price)}</p>
              </div>
              <button onClick={() => removeItem(product.id)} aria-label={`Remove ${product.name} from compare`} className="rounded-full p-1 text-neutral-500 hover:bg-white hover:text-primary"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clear} className="rounded-full px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-50">Clear</button>
          <Link href="/compare" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-950">Compare {items.length}/3</Link>
        </div>
      </div>
    </div>
  );
}
