import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { useAuthStore } from "@/store/useAuthStore";
import { wishlistApi, type WishlistItem } from "@/lib/api/wishlist";
import { toast } from "sonner";

interface WishlistState {
  items: Product[];
  _syncing: boolean;
  _syncError: string | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  getTotalItems: () => number;
  syncFromServer: () => Promise<void>;
  clearSyncError: () => void;
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
      _syncError: null,

      addItem: (product) => {
        set((state) =>
          state.items.some((item) => item.id === product.id)
            ? state
            : { items: [...state.items, product] },
        );

        if (isLoggedIn()) {
          wishlistApi.add(product.id).catch((err) => {
            const message = err instanceof Error ? err.message : "Failed to sync wishlist item to server";
            set({ _syncError: message });
            toast.error("Could not save to server. Item saved locally.");
          });
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));

        if (isLoggedIn()) {
          wishlistApi.remove(productId).catch((err) => {
            const message = err instanceof Error ? err.message : "Failed to remove wishlist item from server";
            set({ _syncError: message });
            toast.error("Could not remove from server. Re-syncing may restore this item.");
          });
        }
      },

      toggleItem: (product) =>
        get().isInWishlist(product.id) ? get().removeItem(product.id) : get().addItem(product),

      isInWishlist: (productId) => get().items.some((item) => item.id === productId),

      getTotalItems: () => get().items.length,

      syncFromServer: async () => {
        if (!isLoggedIn()) return;
        set({ _syncing: true, _syncError: null });
        try {
          const response = await wishlistApi.list();
          const serverItems = response.data ?? [];

          const merged = serverItems
            .map((item) => wishlistItemToProduct(item))
            .filter((p): p is Product => p !== null);

          const localItems = get().items;
          const serverIds = new Set(merged.map((item) => item.id));

          for (const localItem of localItems) {
            if (!serverIds.has(localItem.id)) {
              merged.push(localItem);
            }
          }

          const serverOnlyPushes: Promise<unknown>[] = [];
          for (const localItem of localItems) {
            if (!serverIds.has(localItem.id)) {
              serverOnlyPushes.push(wishlistApi.add(localItem.id).catch((err) => console.error("[Wishlist] Failed to sync add:", err)));
            }
          }
          await Promise.allSettled(serverOnlyPushes);

          set({ items: merged, _syncing: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to sync wishlist";
          set({ _syncing: false, _syncError: message });
          toast.error("Wishlist sync failed. Your local changes are saved but not synced to your account.");
        }
      },

      clearSyncError: () => set({ _syncError: null }),
    }),
    { name: "glamo-wishlist-storage", version: 1 },
  ),
);