import type { ApiResponse, CheckoutPayload, Order } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";
import { csrfHeaders } from "@/lib/csrf";

export async function createCheckoutOrder(payload: CheckoutPayload): Promise<ApiResponse<Order>> {
  return apiRequest<Order>("/checkout/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: csrfHeaders(),
  });
}

export async function verifyPayment(orderId: string, provider: "khalti" | "esewa" | "card", token: string): Promise<ApiResponse<Order>> {
  return apiRequest<Order>(`/checkout/orders/${orderId}/payments/${provider}/verify`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
