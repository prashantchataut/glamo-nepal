"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
import { trackCheckoutStart } from "@/lib/tracking";
import { FREE_DELIVERY_THRESHOLD, calculateDeliveryFee } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";

export function CartPageClient() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const subtotal = getSubtotal();
  const delivery = calculateDeliveryFee(subtotal, "Kathmandu", "Bagmati");
  const total = subtotal + delivery;

  function lineKey(productId: string, selectedShade?: string) {
    return `${productId}-${selectedShade || "base"}`;
  }

  function changeQuantity(productId: string, quantity: number, selectedShade?: string) {
    const result = updateQuantity(productId, quantity, selectedShade);
    const key = lineKey(productId, selectedShade);
    setLineErrors((current) => ({ ...current, [key]: result.ok ? "" : result.message || "Unable to update quantity" }));
  }

  if (!items.length) {
    return (
      <main className="bg-brand-bgLight py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8"><EmptyState variant="cart" /></div>
      </main>
    );
  }

  return (
    <main className="bg-brand-bgLight py-12">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="font-display text-3xl font-semibold text-brand-textPrimary md:text-4xl">Shopping cart</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Free delivery on orders over {formatNPR(FREE_DELIVERY_THRESHOLD)}.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {items.map((item) => (
              <div key={lineKey(item.product.id, item.selectedShade)} className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-bgLight">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-label text-[11px] font-bold uppercase tracking-[0.18em] text-brand-textMuted">{item.product.brand}</p>
                        <h2 className="font-display text-lg font-semibold text-brand-textPrimary">{item.product.name}</h2>
                        {item.selectedShade && <p className="text-sm text-brand-textMuted">Shade: {item.selectedShade}</p>}
                      </div>
                      <button onClick={() => removeItem(item.product.id, item.selectedShade)} className="h-11 w-11 shrink-0 rounded-full text-brand-textMuted hover:bg-brand-bgLight hover:text-red-600" aria-label="Remove item">
                        <Trash2 className="mx-auto" size={16} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-full border border-brand-border bg-brand-bgLight p-1">
                        <button disabled={item.quantity <= 1} onClick={() => changeQuantity(item.product.id, item.quantity - 1, item.selectedShade)} aria-label="Decrease quantity" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-white hover:text-brand-primary disabled:opacity-40">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => changeQuantity(item.product.id, item.quantity + 1, item.selectedShade)} aria-label="Increase quantity" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-white hover:text-brand-primary">
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-lg font-semibold text-brand-gold">{formatNPR(item.product.price * item.quantity)}</p>
                    </div>
                    {lineErrors[lineKey(item.product.id, item.selectedShade)] ? <p className="mt-2 text-xs font-semibold text-amber-700">{lineErrors[lineKey(item.product.id, item.selectedShade)]}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-sm h-fit lg:sticky lg:top-28">
            <h2 className="font-display text-xl font-semibold text-brand-textPrimary">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-brand-textMuted">
                <span>Subtotal</span>
                <span className="font-medium text-brand-textPrimary">{formatNPR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-textMuted">
                <span>Delivery</span>
                <span className="font-medium text-brand-textPrimary">{delivery === 0 ? "Free" : formatNPR(delivery)}</span>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-brand-textMuted">Free delivery on orders over {formatNPR(FREE_DELIVERY_THRESHOLD)}</p>
              )}
              <div className="border-t border-brand-border pt-3">
                <div className="flex justify-between font-semibold text-brand-textPrimary">
                  <span>Total</span>
                  <span className="text-lg text-brand-gold">{formatNPR(total)}</span>
                </div>
              </div>
            </div>
            <Link href="/checkout" onClick={() => trackCheckoutStart({ cart_value_npr: subtotal, item_count: items.reduce((t, i) => t + i.quantity, 0) })} className="mt-6 block rounded-full bg-brand-primary py-3.5 text-center font-semibold text-white transition hover:bg-brand-bgDark">
              Proceed to checkout
            </Link>
            <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-brand-textMuted transition hover:text-brand-primary">
              Continue shopping
            </Link>
          </aside>
        </div>
        <ProductRecommendationStrip title="You might also like" subtitle="Complete your order" context="cart" />
      </div>
    </main>
  );
}