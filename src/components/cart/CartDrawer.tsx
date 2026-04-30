"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const { isCartOpen, closeCart } = useUIStore();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const FREE_SHIPPING_THRESHOLD = 2500;
  const totalPrice = getTotalPrice();
  const progress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <h2 className="font-serif text-2xl font-semibold flex items-center gap-2">
                <ShoppingBag size={22} strokeWidth={1.5} /> Your Cart <span className="text-brand-textMuted text-sm font-sans font-normal">({items.length})</span>
              </h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeCart}
                className="p-2 text-brand-textMuted hover:text-brand-primary hover:bg-brand-bgLight rounded-full transition-colors duration-200"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-5 bg-brand-bgLight/50 border-b border-border/30">
              <p className="text-sm text-center mb-3 text-brand-textPrimary font-medium">
                {amountToFreeShipping > 0 ? (
                  <>You are <span className="font-bold text-brand-primary">NPR {amountToFreeShipping.toLocaleString()}</span> away from free shipping!</>
                ) : (
                  <span className="font-bold text-emerald-600">Congratulations! You qualify for free shipping.</span>
                )}
              </p>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-brand-textMuted space-y-4">
                  <ShoppingBag size={64} className="opacity-15" strokeWidth={1} />
                  <p className="text-lg font-serif">Your cart is empty</p>
                  <button
                    onClick={closeCart}
                    className="px-8 py-3 bg-brand-primary text-white rounded-full font-medium hover:bg-brand-bgDark transition-colors duration-300"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 pb-6 border-b border-border/30 last:border-0">
                    <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-brand-bgLight shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-brand-textMuted tracking-[0.15em]">{item.product.brand}</span>
                          <h3 className="text-sm font-semibold text-brand-textPrimary line-clamp-2 leading-tight">
                            {item.product.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-brand-textMuted hover:text-red-500 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="mt-auto flex items-end justify-between">
                        <div className="flex items-center gap-3 border border-border/50 rounded-full px-2 py-1 bg-white">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:text-brand-primary transition-colors disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} strokeWidth={1.5} />
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:text-brand-primary transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                        <span className="font-semibold text-brand-gold text-lg">
                          NPR {(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-border/30 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-brand-textMuted font-medium">Subtotal</span>
                  <span className="font-serif text-2xl font-semibold text-brand-textPrimary">
                    NPR {totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="w-full py-3.5 px-4 rounded-full border-2 border-brand-primary text-brand-primary font-semibold text-center hover:bg-brand-primary/5 transition-colors duration-300"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full py-3.5 px-4 rounded-full bg-brand-primary text-white font-semibold text-center hover:bg-brand-bgDark transition-colors duration-300 shadow-lg shadow-brand-primary/20"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}