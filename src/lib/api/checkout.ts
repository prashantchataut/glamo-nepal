import type { ApiResponse, CheckoutPayload, Order } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function createCheckoutOrder(payload: CheckoutPayload): Promise<ApiResponse<Order>> {
  if (API_BASE_URL) {
    return apiRequest<Order>("/checkout/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body || body.status !== "success") {
    const message = body?.message || "Checkout is not available. Please try again.";
    throw new Error(message);
  }

  return body as ApiResponse<Order>;
}

export async function verifyPayment(orderId: string, provider: "khalti" | "esewa" | "card", token: string): Promise<ApiResponse<Order>> {
  return apiRequest<Order>(`/checkout/orders/${orderId}/payments/${provider}/verify`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
