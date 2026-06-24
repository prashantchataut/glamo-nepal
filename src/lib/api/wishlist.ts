import { apiRequest } from "@/lib/api/client";

/**
 * A wishlist row as returned by the server.
 *
 * The product details are nested under `product`, and pricing uses
 * `basePrice`/`salePrice` (in display rupees) — this differs from the
 * simpler storefront `WishlistItem` we hand to the UI, so we map it in
 * the store rather than using it directly.
 */
export interface ServerWishlistItem {
  id: string;
  productId: string;
  product: {
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    imageUrl: string | null;
    isActive: boolean;
  };
  createdAt: string;
}

export interface ServerWishlistResponse {
  items: ServerWishlistItem[];
}

/** Normalized wishlist item used across the storefront UI. */
export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock: boolean;
}

export const wishlistApi = {
  list: () => apiRequest<ServerWishlistResponse>("/wishlist"),
  add: (productId: string) =>
    apiRequest<WishlistItem>("/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  remove: (productId: string) =>
    apiRequest<void>(`/wishlist/${productId}`, { method: "DELETE" }),
  check: (productId: string) =>
    apiRequest<{ inWishlist: boolean }>(`/wishlist/check/${productId}`),
};