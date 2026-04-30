import type { Address, ApiResponse, Customer, Order, Wishlist } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";

export const customerApi = {
  me: () => apiRequest<Customer>("/customers/me"),
  orders: () => apiRequest<Order[]>("/customers/me/orders"),
  addresses: () => apiRequest<Address[]>("/customers/me/addresses"),
  wishlist: () => apiRequest<Wishlist>("/customers/me/wishlist"),
};
