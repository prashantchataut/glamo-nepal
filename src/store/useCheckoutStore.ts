import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderStatus = "idle" | "pending" | "success" | "failed";

export interface SimulatedOrder {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
}

interface CheckoutState {
  status: OrderStatus;
  lastOrder: SimulatedOrder | null;
  placeOrder: (order: Omit<SimulatedOrder, "createdAt">) => Promise<SimulatedOrder>;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      status: "idle",
      lastOrder: null,
      placeOrder: async (order) => {
        set({ status: "pending" });
        await new Promise((resolve) => setTimeout(resolve, 700));
        const saved = { ...order, createdAt: new Date().toISOString() };
        set({ status: "success", lastOrder: saved });
        return saved;
      },
      reset: () => set({ status: "idle" }),
    }),
    { name: "glamo-checkout-storage" },
  ),
);
