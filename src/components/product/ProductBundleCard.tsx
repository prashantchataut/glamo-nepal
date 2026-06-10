"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import Link from "next/link";
import { Gift, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { HydratedProductBundle } from "@/lib/data/bundles";
import { trackEvent } from "@/lib/analytics";
import { formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export function ProductBundleCard({ bundle, compact = false }: { bundle: HydratedProductBundle; compact?: boolean }) {
  const addItem = useCartStore((state) => state.addItem);
  const addBundle = () => {
    const stocked = bundle.products.filter((product) => product.inStock);
    stocked.forEach((product) => addItem(product));
    trackEvent("bundle_add_to_cart", {
      bundleSlug: bundle.slug,
      value: bundle.bundlePrice,
      productCount: stocked.length,
    });
    toast.success(`${bundle.title} items added to cart`);
  };

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-brand-secondary/20 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/routines/${bundle.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-neutral-50">
        <Image src={bundle.image} alt={bundle.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
        <div className="font-label absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{bundle.eyebrow}</div>
      </Link>
      <div className="p-5 md:p-6">
        <div className="font-label mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          <Sparkles size={14} /> Routine bundle
        </div>
        <Link href={`/routines/${bundle.slug}`}>
          <h3 className="font-display text-2xl font-semibold leading-tight text-neutral-900 transition-colors group-hover:text-primary">{bundle.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">{bundle.description}</p>
        {!compact ? (
          <div className="mt-4 space-y-2">
            {bundle.steps.slice(0, 3).map((step, index) => (
              <div key={step.label} className="flex gap-3 rounded-2xl bg-neutral-50 px-3 py-2 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
                <span className="text-neutral-500"><strong className="text-neutral-900">{step.label}:</strong> {step.note}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div>
            <div className="text-lg font-bold tracking-tight text-secondary">{formatNPR(bundle.bundlePrice)}</div>
            <div className="text-xs text-neutral-500">Bundle saving {formatNPR(bundle.savings)}</div>
          </div>
          <button type="button" onClick={addBundle} aria-label="Add routine to cart" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 cursor-pointer">
            <ShoppingBag size={16} /> Add routine
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500"><Gift size={14} /> Bundle value is confirmed during checkout.</div>
      </div>
    </article>
  );
}
