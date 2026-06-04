import { apiRequest } from "@/lib/api/client";

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
  list: () => apiRequest<WishlistItem[]>("/wishlist"),
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