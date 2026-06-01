import { create } from "zustand";

export type AdminSection =
  | "dashboard"
  | "products"
  | "orders"
  | "inventory"
  | "banners"
  | "customers"
  | "analytics"
  | "settings"
  | "audit";

interface AdminState {
  activeSection: AdminSection;
  sidebarOpen: boolean;
  productSearch: string;
  orderStatusFilter: string;
  customerSearch: string;
  orderDateRange: { start: string; end: string } | null;
  globalSearch: string;
}

interface AdminActions {
  setActiveSection: (section: AdminSection) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setProductSearch: (query: string) => void;
  setOrderStatusFilter: (status: string) => void;
  setCustomerSearch: (query: string) => void;
  setOrderDateRange: (range: { start: string; end: string } | null) => void;
  setGlobalSearch: (query: string) => void;
}

export const useAdminStore = create<AdminState & AdminActions>((set) => ({
  activeSection: "dashboard",
  sidebarOpen: false,
  productSearch: "",
  orderStatusFilter: "",
  customerSearch: "",
  orderDateRange: null,
  globalSearch: "",

  setActiveSection: (section) => set({ activeSection: section, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setProductSearch: (query) => set({ productSearch: query }),
  setOrderStatusFilter: (status) => set({ orderStatusFilter: status }),
  setCustomerSearch: (query) => set({ customerSearch: query }),
  setOrderDateRange: (range) => set({ orderDateRange: range }),
  setGlobalSearch: (query) => set({ globalSearch: query }),
}));