import type { Order } from "@/lib/api/contracts";
import type { Product } from "@/types/product";
import { apiRequest } from "@/lib/api/client";

export interface AdminDashboardSummary {
  products: number;
  lowStock: number;
  outOfStock: number;
  pendingOrders: number;
  revenueToday: number;
  auditWarnings: number;
}

export interface AdminProductUpdatePayload {
  price?: number;
  stockCount?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export const adminApi = {
  summary: () => apiRequest<AdminDashboardSummary>("/admin/summary"),
  products: () => apiRequest<Product[]>("/admin/products"),
  updateProduct: (id: string, payload: AdminProductUpdatePayload) => apiRequest<Product>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  orders: () => apiRequest<Order[]>("/admin/orders"),
};
