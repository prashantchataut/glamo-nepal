"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";
import { trackCheckoutStart } from "@/lib/tracking";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatNpr } from "@/lib/utils";

export function CartPageClient() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : 150;
  const total = subtotal + delivery;

  if (!items.length) {
    return (
      <main className="bg-brand-bgLight py-20">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="mx-auto mb-5 text-brand-secondary" size={72} />
          <h1 className="font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">Your cart is empty</h1>
          <p className="mx-auto mt-3 max-w-md text-brand-textMuted">Explore GLAMO NEPAL skincare, makeup and beauty picks in NPR.</p>
          <Link href="/shop" className="mt-8 inline-flex rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-bgDark">
            Start shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-bgLight py-12">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary md:text-4xl">Shopping cart</h1>
        <p className="mt-1 text-sm text-brand-textMuted">Free delivery on orders over NPR 2,500.</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.selectedShade || "base"}`} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-bgLight">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-textMuted">{item.product.brand}</p>
                        <h2 className="font-serif text-lg font-semibold text-brand-textPrimary">{item.product.name}</h2>
                        {item.selectedShade && <p className="text-sm text-brand-textMuted">Shade: {item.selectedShade}</p>}
                      </div>
                      <button onClick={() => removeItem(item.product.id, item.selectedShade)} className="h-11 w-11 shrink-0 rounded-full text-brand-textMuted hover:bg-brand-bgLight hover:text-red-600" aria-label="Remove item">
                        <Trash2 className="mx-auto" size={16} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex items-center gap-3 rounded-full border border-brand-border bg-brand-bgLight px-3 py-2">
                        <button disabled={item.quantity <= 1} onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedShade)} aria-label="Decrease quantity" className="disabled:opacity-40">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedShade)} aria-label="Increase quantity">
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="text-lg font-bold text-brand-textPrimary">{formatNpr(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <aside className="rounded-2xl bg-white p-6 shadow-sm h-fit lg:sticky lg:top-28">
            <h2 className="font-serif text-xl font-semibold text-brand-textPrimary">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-brand-textMuted">
                <span>Subtotal</span>
                <span className="font-medium text-brand-textPrimary">{formatNpr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-textMuted">
                <span>Delivery</span>
                <span className="font-medium text-brand-textPrimary">{delivery === 0 ? "Free" : formatNpr(delivery)}</span>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-brand-textMuted">Free delivery on orders over {formatNpr(FREE_DELIVERY_THRESHOLD)}</p>
              )}
              <div className="border-t border-brand-border pt-3">
                <div className="flex justify-between font-semibold text-brand-textPrimary">
                  <span>Total</span>
                  <span className="text-lg">{formatNpr(total)}</span>
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