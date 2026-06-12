"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isCartOpen = useUIStore((s) => s.isCartOpen);
  const closeCart = useUIStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const reduceMotion = useReducedMotion();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isCartOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      if (closeBtnRef.current) closeBtnRef.current.focus();
    } else {
      if (triggerRef.current) {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [isCartOpen]);

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
    function onCartPulse() {
      const openCart = useUIStore.getState().openCart;
      openCart();
    }
    window.addEventListener("glamo:cart-pulse", onCartPulse);
    return () => window.removeEventListener("glamo:cart-pulse", onCartPulse);
  }, []);

  useEffect(() => {
    if (isCartOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, handleKeyDown]);

  const totalPrice = getTotalPrice();
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
            className="fixed inset-0 z-cart-backdrop bg-black/50"
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
            <div className="flex items-center justify-between border-b border-neutral-200/80 p-5 md:p-6">
              <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-neutral-900">
                <ShoppingBag size={22} strokeWidth={1.5} /> Your bag{" "}
                <span className="font-sans text-sm font-normal text-neutral-500">({itemCount})</span>
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label="Close cart"
                onClick={closeCart}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5" style={{ WebkitOverflowScrolling: "touch" }}>
              {items.length === 0 ? (
                <EmptyState variant="cart" className="min-h-full py-12" />
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const key = lineKey(item.product.id, item.selectedShade);
                    const error = lineErrors[key];
                    const isOut = !item.product.inStock;
                    return (
                      <div key={key} className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-sm">
                        <div className="flex gap-4">
                          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
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
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                                  {item.product.brand}
                                </span>
                                <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-tight text-neutral-900">
                                  {item.product.name}
                                </h3>
                                {item.selectedShade ? (
                                  <p className="mt-1 text-xs text-neutral-500">Shade: {item.selectedShade}</p>
                                ) : null}
                              </div>
                              <button
                                onClick={() => removeItem(item.product.id, item.selectedShade)}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                aria-label={`Remove ${item.product.name}`}
                              >
                                <Trash2 size={15} strokeWidth={1.7} />
                              </button>
                            </div>
                            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                              <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-1 py-0.5">
                                <button
                                  onClick={() => changeQuantity(item.product.id, item.quantity - 1, item.selectedShade)}
                                  disabled={item.quantity <= 1}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-white hover:text-primary disabled:opacity-40"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} strokeWidth={2} />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold text-neutral-900">{item.quantity}</span>
                                <button
                                  onClick={() => changeQuantity(item.product.id, item.quantity + 1, item.selectedShade)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-white hover:text-primary"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} strokeWidth={2} />
                                </button>
                              </div>
                              <p className="font-display text-base font-bold text-neutral-900">
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

            <div className="shrink-0 border-t border-neutral-200/80 bg-white p-5 safe-area-bottom">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatNPR(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Delivery</span>
                  <span className="font-semibold text-neutral-900">Calculated at checkout</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200/80 pt-3 text-lg font-semibold text-neutral-900">
                  <span>Estimated total</span>
                  <span className="font-display tracking-tight">{formatNPR(totalPrice)}</span>
                </div>
                <p className="text-[11px] text-neutral-500">Final total calculated at checkout with delivery</p>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-5 flex w-full items-center justify-center rounded-full bg-neutral-950 px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Checkout securely
              </Link>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-3 block text-center text-sm font-medium text-neutral-500 transition hover:text-primary"
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