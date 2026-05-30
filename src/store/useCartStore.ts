import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trackEvent } from "@/lib/analytics";
import type { Product, CartItem, CartActionResult, ProductBadge, ProductReviewSummary, ShadeOption } from "@/types/product";

export type { Product, CartItem, CartActionResult, ProductBadge, ProductReviewSummary, ShadeOption };

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedShade?: string) => CartActionResult;
  removeItem: (productId: string, selectedShade?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedShade?: string) => CartActionResult;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotalPrice: () => number;
}
const sameLine = (item: CartItem, productId: string, selectedShade?: string) => item.product.id === productId && (item.selectedShade || "") === (selectedShade || "");
const availableFor = (product: Product, selectedShade?: string) => {
  if (!product.inStock) return 0;
  if (selectedShade && product.shadeOptions) {
    const shade = product.shadeOptions.find((s) => s.name === selectedShade);
    if (shade && shade.stockCount !== undefined) return shade.stockCount;
  }
  return product.stockCount ?? 99;
};
export const useCartStore = create<CartState>()(persist((set, get) => ({
  items: [],
  addItem: (product, quantity = 1, selectedShade) => {
    const available = availableFor(product, selectedShade);
    if (!product.inStock || available < 1) return { ok: false, message: "This product is currently out of stock.", available: 0 };
    let result: CartActionResult = { ok: false, message: "Item not added", available: 0 };
    set((state) => {
      const existing = state.items.find((item) => sameLine(item, product.id, selectedShade));
      const requestedQuantity = (existing?.quantity ?? 0) + quantity;
      if (requestedQuantity > available) {
        result = { ok: false, message: `Only ${available} available`, available };
        return state;
      }
      result = { ok: true, available };
      if (existing) {
        return { items: state.items.map((item) => sameLine(item, product.id, selectedShade) ? { ...item, quantity: item.quantity + quantity } : item) };
      }
      return { items: [...state.items, { product, quantity, selectedShade }] };
    });
    return result;
  },
  removeItem: (productId, selectedShade) => {
    const item = get().items.find((i) => sameLine(i, productId, selectedShade));
    if (item) trackEvent("remove_from_cart", { productId: item.product.id, productSlug: item.product.slug, value: item.product.price, itemCount: item.quantity });
    set((state) => ({ items: state.items.filter((cartItem) => !sameLine(cartItem, productId, selectedShade)) }));
  },
  updateQuantity: (productId, quantity, selectedShade) => {
    if (quantity < 1) { get().removeItem(productId, selectedShade); return { ok: true }; }
    let result: CartActionResult = { ok: false, message: "Item not found", available: 0 };
    set((state) => {
      const item = state.items.find((cartItem) => sameLine(cartItem, productId, selectedShade));
      if (!item) { result = { ok: false, message: "Item not found" }; return state; }
      const available = availableFor(item.product, selectedShade);
      if (quantity > available) { result = { ok: false, message: `Only ${available} available`, available }; return state; }
      result = { ok: true, available };
      return { items: state.items.map((cartItem) => sameLine(cartItem, productId, selectedShade) ? { ...cartItem, quantity } : cartItem) };
    });
    return result;
  },
  clearCart: () => set({ items: [] }),
  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getSubtotal: () => get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
  getTotalPrice: () => {
    const subtotal = get().getSubtotal();
    return subtotal;
  },
}), { name: "glamo-cart-storage", version: 1 }));
