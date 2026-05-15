"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const { isCartOpen, closeCart } = useUIStore();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isCartOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.classList.add("scroll-locked");
    } else {
      document.body.style.paddingRight = "";
      document.body.classList.remove("scroll-locked");
    }
    return () => {
      document.body.style.paddingRight = "";
      document.body.classList.remove("scroll-locked");
    };
  }, [isCartOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    },
    [closeCart],
  );

  useEffect(() => {
    if (isCartOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, handleKeyDown]);

  const totalPrice = getTotalPrice();
  const progress = Math.min((totalPrice / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const amountToFreeShipping = Math.max(FREE_DELIVERY_THRESHOLD - totalPrice, 0);
  const itemCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);

  if (!mounted) return null;

  function lineKey(productId: string, selectedShade?: string) {
    return `${productId}-${selectedShade || "base"}`;
  }

  function changeQuantity(productId: string, nextQuantity: number, selectedShade?: string) {
    const key = lineKey(productId, selectedShade);
    const result = updateQuantity(productId, nextQuantity, selectedShade);
    setLineErrors((current) => ({
      ...current,
      [key]: result.ok ? "" : result.message || "Unable to update quantity",
    }));
  }

  return (
    <AnimatePresence>
      {isCartOpen ? (
        <>
          <motion.div
            key="cart-backdrop"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-cart-backdrop bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            key="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: reduceMotion ? 0 : 384, opacity: reduceMotion ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduceMotion ? 0 : 384, opacity: reduceMotion ? 0 : 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-cart flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-brand-border p-5 md:p-6">
              <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-brand-textPrimary">
                <ShoppingBag size={22} strokeWidth={1.5} /> Your Bag{" "}
                <span className="font-sans text-sm font-normal text-brand-textMuted">({itemCount})</span>
              </h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeCart}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <div className="border-b border-brand-border bg-brand-bgLight/60 p-5">
              <p className="mb-3 text-center text-sm font-medium text-brand-textPrimary">
                {amountToFreeShipping > 0 ? (
                  <>
                    Add <span className="font-bold text-brand-primary">{formatNPR(amountToFreeShipping)}</span> for free
                    delivery.
                  </>
                ) : (
                  <span className="font-bold text-emerald-600">Free delivery unlocked.</span>
                )}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5" style={{ WebkitOverflowScrolling: "touch" }}>
              {items.length === 0 ? (
                <EmptyState variant="cart" className="min-h-full py-12" />
              ) : (
                <div className="space-y-5">
                  {items.map((item) => {
                    const key = lineKey(item.product.id, item.selectedShade);
                    const error = lineErrors[key];
                    const isOut = !item.product.inStock;
                    return (
                      <div key={key} className="rounded-2xl border border-brand-border bg-white p-3 shadow-sm">
                        <div className="flex gap-4">
                          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-bgLight">
                            <Image
                              src={item.product.image}
                              alt={`${item.product.brand} ${item.product.name}`}
                              fill
                              className={`object-cover ${isOut ? "grayscale opacity-70" : ""}`}
                              sizes="96px"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-brand-textMuted">
                                  {item.product.brand}
                                </span>
                                <h3 className="line-clamp-2 font-display text-lg font-semibold leading-tight text-brand-textPrimary">
                                  {item.product.name}
                                </h3>
                                {item.selectedShade ? (
                                  <p className="mt-1 text-xs text-brand-textMuted">Shade: {item.selectedShade}</p>
                                ) : null}
                              </div>
                              <button
                                onClick={() => removeItem(item.product.id, item.selectedShade)}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-brand-bgLight hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                                aria-label={`Remove ${item.product.name}`}
                              >
                                <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                            <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                              <div>
                                <div className="flex items-center gap-2 rounded-full border border-brand-border bg-brand-bgLight px-2 py-1">
                                  <button
                                    onClick={() => changeQuantity(item.product.id, item.quantity - 1, item.selectedShade)}
                                    disabled={item.quantity <= 1}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-white hover:text-brand-primary disabled:opacity-40"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                  <button
                                    onClick={() => changeQuantity(item.product.id, item.quantity + 1, item.selectedShade)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-textMuted transition hover:bg-white hover:text-brand-primary"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-lg font-semibold text-brand-gold">
                                {formatNPR(item.product.price * item.quantity)}
                              </p>
                            </div>
                            {error ? (
                              <p className="mt-2 text-xs font-semibold text-amber-700" role="alert">
                                {error}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-brand-border bg-white p-5 safe-area-bottom">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-brand-textMuted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-textPrimary">{formatNPR(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-brand-textMuted">
                  <span>Delivery</span>
                  <span className="font-semibold text-brand-textPrimary">Calculated at checkout</span>
                </div>
                <div className="flex justify-between border-t border-brand-border pt-3 text-lg font-semibold text-brand-textPrimary">
                  <span>Total</span>
                  <span className="text-brand-gold tracking-tight">{formatNPR(totalPrice)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-5 flex w-full items-center justify-center rounded-full bg-brand-primary px-6 py-4 text-sm font-bold text-white shadow-md shadow-brand-primary/15 transition hover:-translate-y-0.5 hover:bg-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 cursor-pointer"
              >
                Checkout securely
              </Link>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-3 block text-center text-sm font-semibold text-brand-textMuted transition hover:text-brand-primary"
              >
                Continue shopping
              </Link>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}