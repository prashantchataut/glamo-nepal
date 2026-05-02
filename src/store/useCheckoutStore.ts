import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface CheckoutState {
  status: OrderStatus;
  lastOrder: SimulatedOrder | null;
  orders: SimulatedOrder[];
  placeOrder: (order: Omit<SimulatedOrder, "id" | "createdAt" | "date" | "status"> & Partial<Pick<SimulatedOrder, "status">>) => Promise<SimulatedOrder>;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      status: "idle",
      lastOrder: null,
      orders: [],
      placeOrder: async (order) => {
        set({ status: "pending" });
        await new Promise((resolve) => setTimeout(resolve, 450));
        const createdAt = new Date().toISOString();
        const saved: SimulatedOrder = {
          ...order,
          id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
          status: order.status || "Confirmed",
          createdAt,
          date: createdAt.slice(0, 10),
        };
        const existing = get().orders.filter((item) => item.orderNumber !== saved.orderNumber);
        set({ status: "success", lastOrder: saved, orders: [saved, ...existing].slice(0, 20) });
        return saved;
      },
      reset: () => set({ status: "idle" }),
    }),
    { name: "glamo-checkout-storage" },
  ),
);
