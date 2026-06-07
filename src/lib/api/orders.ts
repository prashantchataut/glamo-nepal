import type { Order } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";

export interface OrderListParams {
  status?: string;
  page?: number;
  perPage?: number;
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return `${path}${query.toString() ? `?${query.toString()}` : ""}`;
}

export const ordersApi = {
  list: (params: OrderListParams = {}) => apiRequest<Order[]>(withQuery("/orders", params as Record<string, string | number | undefined>)),
  get: (id: string) => apiRequest<Order>(`/orders/${id}`),
  cancel: (id: string) => apiRequest<Order>(`/orders/${id}/cancel`, { method: "POST" }),
  trackByOrderNumber: (orderNumber: string) => apiRequest<Order>(`/checkout/track/${encodeURIComponent(orderNumber)}`),
};
