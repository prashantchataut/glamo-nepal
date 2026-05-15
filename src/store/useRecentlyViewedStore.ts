import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

interface RecentlyViewedState {
  items: Product[];
  addItem: (product: Product) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) => set((state) => ({ items: [product, ...state.items.filter((item) => item.id !== product.id)].slice(0, 8) })),
      clear: () => set({ items: [] }),
    }),
    { name: "glamo-recently-viewed-storage" },
  ),
);
