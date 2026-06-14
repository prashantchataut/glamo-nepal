import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trackEvent } from "@/lib/analytics";
import { useAuthStore } from "@/store/useAuthStore";
import { cartApi, type ServerCartItem } from "@/lib/api/cart";
import type { Product, CartItem, CartActionResult, ProductBadge, ProductReviewSummary, ShadeOption } from "@/types/product";

export type { Product, CartItem, CartActionResult, ProductBadge, ProductReviewSummary, ShadeOption };

interface CartState {
  items: CartItem[];
  _syncing: boolean;
  _serverItemIds: Record<string, string>;
  addItem: (product: Product, quantity?: number, selectedShade?: string) => CartActionResult;
  removeItem: (productId: string, selectedShade?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedShade?: string) => CartActionResult;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotalPrice: () => number;
  syncFromServer: () => Promise<void>;
}

const sameLine = (item: CartItem, productId: string, selectedShade?: string) =>
  item.product.id === productId && (item.selectedShade || "") === (selectedShade || "");

const availableFor = (product: Product, selectedShade?: string) => {
  if (!product.inStock) return 0;
  if (selectedShade && product.shadeOptions) {
    const shade = product.shadeOptions.find((s) => s.name === selectedShade);
    if (shade && shade.stockCount !== undefined) return shade.stockCount;
  }
  return product.stockCount ?? 99;
};

function serverItemToLocal(item: ServerCartItem): CartItem | null {
  if (!item.product) return null;
  return {
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      sku: "",
      brand: "",
      category: "",
      subCategory: "",
      price: item.product.price,
      image: item.product.image,
      inStock: item.product.inStock,
      stockCount: item.product.stockCount,
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
    },
    quantity: item.quantity,
    selectedShade: item.selectedShade,
  };
}

function itemKey(productId: string, selectedShade?: string): string {
  return `${productId}::${selectedShade || ""}`;
}

function isLoggedIn(): boolean {
  const { isConfigured, user } = useAuthStore.getState();
  return isConfigured && !!user;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _syncing: false,
      _serverItemIds: {},

      addItem: (product, quantity = 1, selectedShade) => {
        const available = availableFor(product, selectedShade);
        if (!product.inStock || available < 1)
          return { ok: false, message: "This product is currently out of stock.", available: 0 };

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
            return {
              items: state.items.map((item) =>
                sameLine(item, product.id, selectedShade)
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { product, quantity, selectedShade }] };
        });

        if (result.ok && isLoggedIn()) {
          cartApi
            .add(product.id, quantity, selectedShade)
            .catch((err) => console.error("[Cart] Failed to sync add:", err));
        }

        return result;
      },

      removeItem: (productId, selectedShade) => {
        const item = get().items.find((i) => sameLine(i, productId, selectedShade));
        if (item) {
          trackEvent("remove_from_cart", {
            productId: item.product.id,
            productSlug: item.product.slug,
            value: item.product.price,
            itemCount: item.quantity,
          });
        }

        set((state) => ({
          items: state.items.filter((cartItem) => !sameLine(cartItem, productId, selectedShade)),
        }));

        if (isLoggedIn()) {
          const serverId = get()._serverItemIds[itemKey(productId, selectedShade)];
          if (serverId) {
            cartApi.remove(serverId).catch((err) => console.error("[Cart] Failed to sync remove:", err));
          }
        }
      },

      updateQuantity: (productId, quantity, selectedShade) => {
        if (quantity < 1) {
          get().removeItem(productId, selectedShade);
          return { ok: true };
        }

        let result: CartActionResult = { ok: false, message: "Item not found", available: 0 };

        set((state) => {
          const item = state.items.find((cartItem) => sameLine(cartItem, productId, selectedShade));
          if (!item) {
            result = { ok: false, message: "Item not found" };
            return state;
          }
          const available = availableFor(item.product, selectedShade);
          if (quantity > available) {
            result = { ok: false, message: `Only ${available} available`, available };
            return state;
          }
          result = { ok: true, available };
          return {
            items: state.items.map((cartItem) =>
              sameLine(cartItem, productId, selectedShade)
                ? { ...cartItem, quantity }
                : cartItem,
            ),
          };
        });

        if (result.ok && isLoggedIn()) {
          const serverId = get()._serverItemIds[itemKey(productId, selectedShade)];
          if (serverId) {
            cartApi.update(serverId, quantity).catch((err) => console.error("[Cart] Failed to sync update:", err));
          }
        }

        return result;
      },

      clearCart: () => {
        set({ items: [] });
        if (isLoggedIn()) {
          cartApi.clear().catch((err) => console.error("[Cart] Failed to sync clear:", err));
        }
      },

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () => get().items.reduce((total, item) => total + item.product.price * item.quantity, 0),
      getTotalPrice: () => get().getSubtotal(),

      syncFromServer: async () => {
        if (!isLoggedIn()) return;
        set({ _syncing: true });
        try {
          const response = await cartApi.list();
          const serverItems = response.data ?? [];
          const localItems = get().items;

          const serverIds: Record<string, string> = {};
          const merged: CartItem[] = [];

          for (const serverItem of serverItems) {
            const local = serverItemToLocal(serverItem);
            if (!local) continue;

            serverIds[itemKey(local.product.id, local.selectedShade)] = serverItem.id;

            const existingIdx = localItems.findIndex(
              (item) =>
                item.product.id === local.product.id &&
                (item.selectedShade || "") === (local.selectedShade || ""),
            );

            if (existingIdx >= 0) {
              merged.push({
                ...localItems[existingIdx],
                quantity: Math.max(localItems[existingIdx].quantity, local.quantity),
              });
            } else {
              merged.push(local);
            }
          }

          for (const localItem of localItems) {
            const key = itemKey(localItem.product.id, localItem.selectedShade);
            if (!(key in serverIds)) {
              merged.push(localItem);
            }
          }

          set({ items: merged, _syncing: false, _serverItemIds: serverIds });
        } catch {
          set({ _syncing: false });
        }
      },
    }),
    { name: "glamo-cart-storage", version: 2, migrate: (persistedState: unknown, version: number) => {
        const persisted = persistedState as Record<string, unknown>;
        if (version < 2) {
          const state = { ...persisted };
          if (state._serverItemIds instanceof Map || typeof state._serverItemIds === "object") {
            state._serverItemIds = {};
          }
          return state;
        }
        return persisted;
      } },
  ),
);