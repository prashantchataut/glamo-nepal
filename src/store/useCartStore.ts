import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProductBadge = "Best Seller" | "New" | "Sale" | "Limited";

export interface ProductReviewSummary {
  average: number;
  count: number;
  highlights: string[];
}

export interface ShadeOption {
  name: string;
  hex?: string;
  stockCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice?: number;
  mrp?: number;
  image: string;
  images?: string[];
  badge?: ProductBadge;
  rating: number;
  reviewsCount: number;
  reviewSummary?: ProductReviewSummary;
  skinType: string[];
  concernTags: string[];
  benefits: string[];
  howToUse: string[];
  ingredients: string[];
  size: string;
  origin: string;
  madeInNepal: boolean;
  shadeOptions?: ShadeOption[];
  stockCount: number;
  inStock: boolean;
  sourceAuditNote: string;
  description: string;
  deliveryNote?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedShade?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, selectedShade?: string) => void;
  removeItem: (productId: string, selectedShade?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedShade?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotalPrice: () => number;
}

const sameLine = (item: CartItem, productId: string, selectedShade?: string) =>
  item.product.id === productId && (item.selectedShade || "") === (selectedShade || "");

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, selectedShade) => {
        set((state) => {
          const existing = state.items.find((item) => sameLine(item, product.id, selectedShade));
          if (existing) {
            return {
              items: state.items.map((item) =>
                sameLine(item, product.id, selectedShade)
                  ? { ...item, quantity: Math.min(item.quantity + quantity, product.stockCount || 99) }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { product, quantity, selectedShade }] };
        });
      },
      removeItem: (productId, selectedShade) => {
        set((state) => ({ items: state.items.filter((item) => !sameLine(item, productId, selectedShade)) }));
      },
      updateQuantity: (productId, quantity, selectedShade) => {
        if (quantity < 1) return get().removeItem(productId, selectedShade);
        set((state) => ({
          items: state.items.map((item) =>
            sameLine(item, productId, selectedShade)
              ? { ...item, quantity: Math.min(quantity, item.product.stockCount || 99) }
              : item,
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () => get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    }),
    { name: "glamo-cart-storage" },
  ),
);
