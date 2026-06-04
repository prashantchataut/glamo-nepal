import { apiRequest } from "@/lib/api/client";

export interface ServerCartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedShade?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    inStock: boolean;
    stockCount: number;
  };
}

export const cartApi = {
  list: () => apiRequest<ServerCartItem[]>("/cart"),
  add: (productId: string, quantity: number, selectedShade?: string) =>
    apiRequest<ServerCartItem>("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, selectedShade }),
    }),
  update: (cartItemId: string, quantity: number) =>
    apiRequest<ServerCartItem>(`/cart/${cartItemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  remove: (cartItemId: string) =>
    apiRequest<void>(`/cart/${cartItemId}`, { method: "DELETE" }),
  clear: () => apiRequest<void>("/cart", { method: "DELETE" }),
};