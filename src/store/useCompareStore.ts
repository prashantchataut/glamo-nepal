import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface CompareState {
  items: Product[];
  addItem: (product: Product) => boolean;
  removeItem: (productId: string) => void;
  clear: () => void;
  isInCompare: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const items = get().items;
        if (items.some((item) => item.id === product.id)) return true;
        if (items.length >= 3) return false;
        set({ items: [...items, product] });
        return true;
      },
      removeItem: (productId) => set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      clear: () => set({ items: [] }),
      isInCompare: (productId) => get().items.some((item) => item.id === productId),
    }),
    { name: "glamo-compare-storage", version: 1 },
  ),
);
