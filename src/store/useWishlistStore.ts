import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { useAuthStore } from "@/store/useAuthStore";
import { wishlistApi, type WishlistItem } from "@/lib/api/wishlist";

interface WishlistState {
  items: Product[];
  _syncing: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  getTotalItems: () => number;
  syncFromServer: () => Promise<void>;
}

function isLoggedIn(): boolean {
  const { isConfigured, user } = useAuthStore.getState();
  return isConfigured && !!user;
}

function wishlistItemToProduct(item: WishlistItem): Product {
  return {
    id: item.productId,
    name: item.name,
    slug: item.slug,
    sku: "",
    brand: "",
    category: "",
    subCategory: "",
    price: item.price,
    image: item.image,
    inStock: item.inStock,
    stockCount: item.inStock ? 99 : 0,
    rating: 0,
    reviewsCount: 0,
    skinType: [],
    concernTags: [],
    benefits: [],
    howToUse: [],
    ingredients: [],
    size: "",
    origin: "",
    madeInNepal: false,
    description: "",
  };
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      _syncing: false,

      addItem: (product) => {
        set((state) =>
          state.items.some((item) => item.id === product.id)
            ? state
            : { items: [...state.items, product] },
        );

        if (isLoggedIn()) {
          wishlistApi.add(product.id).catch(() => {});
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));

        if (isLoggedIn()) {
          wishlistApi.remove(productId).catch(() => {});
        }
      },

      toggleItem: (product) =>
        get().isInWishlist(product.id) ? get().removeItem(product.id) : get().addItem(product),

      isInWishlist: (productId) => get().items.some((item) => item.id === productId),

      getTotalItems: () => get().items.length,

      syncFromServer: async () => {
        if (!isLoggedIn()) return;
        set({ _syncing: true });
        try {
          const response = await wishlistApi.list();
          const serverItems = response.data ?? [];
          const localItems = get().items;

          const localIds = new Set(localItems.map((item) => item.id));
          const merged = [...localItems];

          for (const serverItem of serverItems) {
            if (!localIds.has(serverItem.productId)) {
              merged.push(wishlistItemToProduct(serverItem));
            }
          }

          set({ items: merged, _syncing: false });
        } catch {
          set({ _syncing: false });
        }
      },
    }),
    { name: "glamo-wishlist-storage", version: 1 },
  ),
);