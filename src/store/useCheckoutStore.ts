import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createCheckoutOrder } from "@/lib/api/checkout";
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
  deliveryFee: number;
  subtotal: number;
  grandTotal: number;
  currency: "NPR";
}

interface CheckoutState {
  status: OrderStatus;
  error: string | null;
  lastOrder: SimulatedOrder | null;
  orders: SimulatedOrder[];
  placeOrder: (order: Omit<SimulatedOrder, "id" | "createdAt" | "date" | "status"> & Partial<Pick<SimulatedOrder, "status">>, payload: CheckoutPayload) => Promise<SimulatedOrder>;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      status: "idle",
      error: null,
      lastOrder: null,
      orders: [],
      placeOrder: async (order, payload) => {
        set({ status: "pending", error: null });
        try {
          const apiResponse = await createCheckoutOrder(payload as any);
          const apiOrder = apiResponse.data;
          const createdAt = apiOrder.createdAt || new Date().toISOString();
          const saved: SimulatedOrder = {
            ...order,
            id: apiOrder.id,
            orderNumber: apiOrder.orderNumber || order.orderNumber,
            status: (apiOrder.orderStatus === "confirmed" ? "Confirmed" : apiOrder.orderStatus === "processing" ? "Processing" : apiOrder.orderStatus === "shipped" ? "Shipped" : apiOrder.orderStatus === "delivered" ? "Delivered" : apiOrder.orderStatus === "cancelled" ? "Cancelled" : "Pending") as CustomerOrderStatus,
            createdAt,
            date: createdAt.slice(0, 10),
          };
          const existing = get().orders.filter((item) => item.orderNumber !== saved.orderNumber);
          set({ status: "success", lastOrder: saved, orders: [saved, ...existing].slice(0, 20) });
          return saved;
        } catch (err) {
          let errorMessage: string;
          if (err instanceof GlamoApiError && err.code === "API_BASE_URL_MISSING") {
            errorMessage = "Checkout is not available yet. Please try again later or contact us on WhatsApp.";
          } else if (err instanceof Error) {
            errorMessage = err.message;
          } else {
            errorMessage = "Something went wrong. Please try again.";
          }
          set({ status: "failed", error: errorMessage });
          throw err;
        }
      },
      reset: () => set({ status: "idle", error: null }),
    }),
    { name: "glamo-checkout-storage" },
  ),
);