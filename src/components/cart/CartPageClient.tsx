"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { FREE_DELIVERY_THRESHOLD, calculateDeliveryFee } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";
import { trackCheckoutStart } from "@/lib/tracking";

export function CartPageClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const delivery = calculateDeliveryFee(subtotal, "Kathmandu", "Bagmati");
  const total = subtotal + delivery;

  if (!mounted) {
    return (
      <main className="bg-neutral-50 py-12 page-padding">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-32 skeleton-shimmer" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 skeleton-shimmer" />
              ))}
            </div>
            <div className="h-64 skeleton-shimmer" />
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="bg-neutral-50 py-24">
        <div className="mx-auto max-w-lg text-center px-4">
          <ShoppingBag size={48} className="mx-auto text-neutral-300" />
          <h1 className="type-display-md text-neutral-900 mt-6">Your bag is empty</h1>
          <p className="type-body-md text-neutral-400 mt-3">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center justify-center bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark cursor-pointer"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-neutral-50 py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h1 className="type-display-lg text-neutral-900">Shopping Cart</h1>
        <p className="type-body-sm text-neutral-400 mt-1">
          Free delivery on orders over {formatNPR(FREE_DELIVERY_THRESHOLD)}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Cart items */}
          <section className="space-y-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedShade || "base"}`}
                className="flex gap-4 border border-neutral-200 bg-surface p-4"
              >
                <Link
                  href={`/product/${item.product.slug}`}
                  className="relative h-24 w-20 shrink-0 overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="type-label text-[10px] text-neutral-400">
                        {item.product.brand}
                      </p>
                      <h2 className="font-display text-base text-neutral-900 leading-snug">
                        {item.product.name}
                      </h2>
                      {item.selectedShade && (
                        <p className="type-body-sm text-neutral-400 mt-0.5">
                          Shade: {item.selectedShade}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.selectedShade)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400 hover:text-error transition-colors cursor-pointer"
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-neutral-200">
                      <button
                        type="button"
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1, item.selectedShade)
                        }
                        className="flex h-9 w-9 items-center justify-center text-neutral-700 transition-colors hover:text-primary disabled:opacity-40 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1, item.selectedShade)
                        }
                        className="flex h-9 w-9 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="type-price text-neutral-900">
                      {formatNPR(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Order summary */}
          <aside className="border border-neutral-200 bg-surface p-6 h-fit lg:sticky lg:top-24">
            <h2 className="type-heading-sm text-neutral-900">Order Summary</h2>
            <div className="mt-5 space-y-3 type-body-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="text-neutral-900">{formatNPR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Shipping</span>
                <span className="text-neutral-900">
                  {delivery === 0 ? "Free" : formatNPR(delivery)}
                </span>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-neutral-400">
                  Free delivery on orders over {formatNPR(FREE_DELIVERY_THRESHOLD)}
                </p>
              )}
              <div className="border-t border-neutral-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-neutral-900">Total</span>
                  <span className="type-price text-neutral-900">{formatNPR(total)}</span>
                </div>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() =>
                trackCheckoutStart({
                  cart_value_npr: subtotal,
                  item_count: items.reduce((t, i) => t + i.quantity, 0),
                })
              }
              className="mt-6 block bg-primary py-3 text-center text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark cursor-pointer"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/shop"
              className="mt-3 block text-center type-body-sm text-neutral-400 hover:text-primary transition-colors"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}