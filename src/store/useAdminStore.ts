import { create } from "zustand";

export type AdminSection =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "delivery"
  | "promotions"
  | "returns"
  | "reviews"
  | "popups"
  | "setup"
  | "support"
  | "backups"
  | "analytics"
  | "settings"
  | "audit"
  | "content";

interface AdminUser {
  email: string;
  name: string;
  role: string;
}

const ROLE_HIERARCHY: Record<string, string[]> = {
  OWNER: ["OWNER", "SUPER_ADMIN", "ADMIN"],
  SUPER_ADMIN: ["SUPER_ADMIN", "ADMIN"],
  ADMIN: ["ADMIN"],
};

export function canAccess(userRole: string, requiredRole: string): boolean {
  const allowed = ROLE_HIERARCHY[userRole] || [userRole];
  return allowed.includes(requiredRole);
}


interface AdminState {
  activeSection: AdminSection;
  sidebarOpen: boolean;
  productSearch: string;
  orderStatusFilter: string;
  orderSearch: string;
  customerSearch: string;
  orderDateRange: { start: string; end: string } | null;
  globalSearch: string;
  adminUser: AdminUser | null;
}

interface AdminActions {
  setActiveSection: (section: AdminSection) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setProductSearch: (query: string) => void;
  setOrderStatusFilter: (status: string) => void;
  setOrderSearch: (query: string) => void;
  setCustomerSearch: (query: string) => void;
  setOrderDateRange: (range: { start: string; end: string } | null) => void;
  setGlobalSearch: (query: string) => void;
  setAdminUser: (user: AdminUser | null) => void;
}

export const useAdminStore = create<AdminState & AdminActions>((set) => ({
  activeSection: "dashboard",
  sidebarOpen: false,
  productSearch: "",
  orderStatusFilter: "",
  orderSearch: "",
  customerSearch: "",
  orderDateRange: null,
  globalSearch: "",
  adminUser: null,

  setActiveSection: (section) => set({ activeSection: section, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setProductSearch: (query) => set({ productSearch: query }),
  setOrderStatusFilter: (status) => set({ orderStatusFilter: status }),
  setOrderSearch: (query) => set({ orderSearch: query }),
  setCustomerSearch: (query) => set({ customerSearch: query }),
  setOrderDateRange: (range) => set({ orderDateRange: range }),
  setGlobalSearch: (query) => set({ globalSearch: query }),
  setAdminUser: (user) => set({ adminUser: user }),
}));