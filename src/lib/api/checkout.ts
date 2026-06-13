import type { ApiResponse, CheckoutPayload, Order } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";

export async function createCheckoutOrder(payload: CheckoutPayload): Promise<ApiResponse<Order>> {
  return apiRequest<Order>("/checkout/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface CouponValidationResult {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  discountAmount: number;
  cartTotal: number;
}

export async function validateCoupon(code: string, cartTotal: number): Promise<CouponValidationResult> {
  const response = await apiRequest<CouponValidationResult>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code, cartTotal }),
  });
  return response.data;
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
