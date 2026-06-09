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

export interface KhaltiInitiateResult {
  paymentUrl: string;
  pidx: string;
}

export async function initiateKhaltiPayment(orderId: string): Promise<ApiResponse<KhaltiInitiateResult>> {
  return apiRequest<KhaltiInitiateResult>(`/checkout/orders/${orderId}/payments/khalti/initiate`, {
    method: "POST",
  });
}

export interface EsewaInitiateResult {
  url: string;
  payload: Record<string, string>;
}

export async function initiateEsewaPayment(orderId: string): Promise<ApiResponse<EsewaInitiateResult>> {
  return apiRequest<EsewaInitiateResult>(`/checkout/orders/${orderId}/payments/esewa/initiate`, {
    method: "POST",
  });
}
