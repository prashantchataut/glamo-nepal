import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  getTotalItems: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => set((state) => state.items.some((item) => item.id === product.id) ? state : { items: [...state.items, product] }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      toggleItem: (product) => get().isInWishlist(product.id) ? get().removeItem(product.id) : get().addItem(product),
      isInWishlist: (productId) => get().items.some((item) => item.id === productId),
      getTotalItems: () => get().items.length,
    }),
    { name: "glamo-wishlist-storage" },
  ),
);
