import type { Order } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import { csrfHeaders } from "@/lib/csrf";

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

function normalizeOrder(raw: Record<string, unknown>): Order {
  const status = (raw.status || raw.orderStatus || "pending") as string;
  const normalizedStatus = status.toLowerCase() as Order["orderStatus"];
  return {
    id: raw.id as string,
    orderNumber: raw.orderNumber as string,
    customer: raw.customer as Order["customer"],
    shippingAddress: raw.shippingAddress as Order["shippingAddress"],
    items: (raw.items || []) as Order["items"],
    paymentMethod: (raw.paymentMethod || "cod") as Order["paymentMethod"],
    paymentStatus: ((raw.paymentStatus || "pending") as string).toLowerCase() as Order["paymentStatus"],
    orderStatus: normalizedStatus,
    status: normalizedStatus,
    subtotal: (raw.subtotal ?? 0) as number,
    shippingCharge: (raw.shippingCharge ?? raw.deliveryFee ?? 0) as number,
    deliveryFee: (raw.deliveryFee ?? raw.shippingCharge ?? 0) as number,
    codFee: (raw.codFee ?? 0) as number,
    giftWrapFee: (raw.giftWrapFee ?? 0) as number,
    discountAmount: (raw.discountAmount ?? 0) as number,
    totalAmount: (raw.totalAmount ?? 0) as number,
    grandTotal: (raw.grandTotal ?? raw.totalAmount ?? 0) as number,
    currency: "NPR",
    createdAt: raw.createdAt as string,
  };
}

export const ordersApi = {
  list: async (params: OrderListParams = {}): Promise<{ data: Order[]; meta?: Record<string, unknown> }> => {
    const result = await apiRequest<Record<string, unknown>[]>(withQuery("/orders", params as Record<string, string | number | undefined>));
    if (Array.isArray(result.data)) {
      return { data: result.data.map(normalizeOrder), meta: result.meta as Record<string, unknown> | undefined };
    }
    return { data: [normalizeOrder(result.data as Record<string, unknown>)], meta: result.meta as Record<string, unknown> | undefined };
  },
  get: async (id: string): Promise<{ data: Order }> => {
    const result = await apiRequest<Record<string, unknown>>(`/orders/${id}`);
    return { data: normalizeOrder(result.data as Record<string, unknown>) };
  },
  cancel: async (id: string): Promise<{ data: Order }> => {
    const result = await apiRequest<Record<string, unknown>>(`/orders/${id}/cancel`, { method: "POST", headers: csrfHeaders() });
    return { data: normalizeOrder(result.data as Record<string, unknown>) };
  },
  trackByOrderNumber: async (orderNumber: string): Promise<{ data: Order }> => {
    const result = await apiRequest<Record<string, unknown>>(`/checkout/track/${encodeURIComponent(orderNumber)}`);
    return { data: normalizeOrder(result.data as Record<string, unknown>) };
  },
};
