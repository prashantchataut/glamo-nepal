import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createCheckoutOrder } from "@/lib/api/checkout";
import type { CheckoutPayload as ApiCheckoutPayload } from "@/lib/api/contracts";
import { GlamoApiError } from "@/lib/api/client";

export type OrderStatus = "idle" | "pending" | "success" | "failed";
export type CustomerOrderStatus = "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface CheckoutLineItem {
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
  selectedShade?: string;
}

export interface SimulatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
  customerName?: string;
  customerPhone?: string;
  status: CustomerOrderStatus;
  items: CheckoutLineItem[];
  createdAt: string;
  date: string;
}

export interface CheckoutPayload {
  customer: { name: string; email: string; phone: string };
  shippingAddress: {
    fullName: string;
    phone: string;
    province: string;
    district: string;
    city: string;
    ward: string;
    addressLine1: string;
  };
  items: { productId: string; sku?: string; name: string; price: number; quantity: number; selectedShade?: string; image?: string; brand?: string }[];
  paymentMethod: string;
  giftWrap?: boolean;
  orderNotes?: string;
  couponCode?: string;
  deliveryFee: number;
  subtotal: number;
  grandTotal: number;
  currency: "NPR";
}

interface CheckoutState {
  status: OrderStatus;
  error: string | null;
  errorCode: string | null;
  lastOrder: SimulatedOrder | null;
  orders: SimulatedOrder[];
  couponCode: string | null;
  discountAmount: number;
  couponError: string | null;
  couponLoading: boolean;
  placeOrder: (order: Omit<SimulatedOrder, "id" | "createdAt" | "date" | "status"> & Partial<Pick<SimulatedOrder, "status">>, payload: CheckoutPayload) => Promise<SimulatedOrder>;
  applyCoupon: (code: string, cartTotal: number) => Promise<void>;
  removeCoupon: () => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      status: "idle",
      error: null,
      errorCode: null,
      lastOrder: null,
      orders: [],
      couponCode: null,
      discountAmount: 0,
      couponError: null,
      couponLoading: false,
      applyCoupon: async (code, cartTotal) => {
        set({ couponLoading: true, couponError: null });
        try {
          const { validateCoupon } = await import("@/lib/api/checkout");
          const result = await validateCoupon(code, cartTotal);
          if (!result.discountAmount || result.discountAmount <= 0) {
            set({ couponCode: null, discountAmount: 0, couponError: "This coupon does not provide a discount for your cart total.", couponLoading: false });
            return;
          }
          set({ couponCode: result.code, discountAmount: result.discountAmount, couponError: null, couponLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid coupon code";
          set({ couponCode: null, discountAmount: 0, couponError: message, couponLoading: false });
        }
      },
      removeCoupon: () => set({ couponCode: null, discountAmount: 0, couponError: null }),
      placeOrder: async (order, payload) => {
        set({ status: "pending", error: null, errorCode: null });
        try {
          const apiResponse = await createCheckoutOrder(payload as unknown as ApiCheckoutPayload);
          const apiOrder = apiResponse.data;
          const createdAt = apiOrder.createdAt || new Date().toISOString();
          const rawStatus = (apiOrder.status || apiOrder.orderStatus || 'pending').toLowerCase();
          const statusMap: Record<string, CustomerOrderStatus> = {
            pending: "Pending",
            confirmed: "Confirmed",
            processing: "Processing",
            shipped: "Shipped",
            delivered: "Delivered",
            cancelled: "Cancelled",
          };
          const saved: SimulatedOrder = {
            ...order,
            id: apiOrder.id,
            orderNumber: apiOrder.orderNumber || order.orderNumber,
            status: statusMap[rawStatus] || "Pending",
            createdAt,
            date: createdAt.slice(0, 10),
          };
          const existing = get().orders.filter((item) => item.orderNumber !== saved.orderNumber);
          set({ status: "success", error: null, errorCode: null, lastOrder: saved, orders: [saved, ...existing].slice(0, 20) });
          return saved;
        } catch (err) {
          let errorMessage: string;
          if (err instanceof GlamoApiError && (err.code === "NETWORK_ERROR" || err.code === "API_BASE_URL_MISSING")) {
            errorMessage = "Unable to connect to the server. Please check your connection and try again.";
          } else if (err instanceof GlamoApiError && err.code === "PRICE_MISMATCH") {
            errorMessage = err.message || "Prices changed. Please refresh and try again.";
          } else if (err instanceof GlamoApiError && err.code === "INSUFFICIENT_STOCK") {
            errorMessage = err.message || "Out of stock. Please try again.";
          } else if (err instanceof GlamoApiError && err.fieldErrors) {
            const firstField = Object.values(err.fieldErrors).find((messages) => messages?.length);
            errorMessage = firstField?.[0] || err.message || "Please review your details and try again.";
          } else if (err instanceof GlamoApiError) {
            errorMessage = err.message || "Something went wrong. Please try again.";
          } else if (err instanceof Error) {
            errorMessage = err.message;
          } else {
            errorMessage = "Something went wrong. Please try again.";
          }
          set({ status: "failed", error: errorMessage, errorCode: err instanceof GlamoApiError ? err.code ?? null : null });
          throw err;
        }
      },
      reset: () => set({ status: "idle", error: null, errorCode: null, couponCode: null, discountAmount: 0, couponError: null }),
    }),
    {
      name: "glamo-checkout-storage",
      version: 1,
      partialize: (state) => ({
        status: state.status,
        error: state.error,
        errorCode: state.errorCode,
        lastOrder: state.lastOrder,
        orders: state.orders,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.status === "pending") {
          state.status = "idle";
          state.error = null;
          state.errorCode = null;
        }
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        state.orders = state.orders.filter((order) => {
          const createdAt = new Date(order.createdAt).getTime();
          return Number.isNaN(createdAt) || createdAt >= cutoff;
        });
      },
    },
  ),
);