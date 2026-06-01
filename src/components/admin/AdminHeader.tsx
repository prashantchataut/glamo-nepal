"use client";

import { Menu, Bell, ChevronDown, Search } from "lucide-react";
import type { AdminSection } from "@/store/useAdminStore";

const sectionLabels: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  inventory: "Stocks",
  banners: "Banners",
  customers: "Customers",
  analytics: "Analytics",
  settings: "Settings",
};

interface AdminHeaderProps {
  activeSection: AdminSection;
  onMenuToggle: () => void;
}

export function AdminHeader({ activeSection, onMenuToggle }: AdminHeaderProps) {
  return (
    <header role="banner" className="sticky top-0 z-admin-header border-b border-brand-border bg-white/95 px-4 py-4 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onMenuToggle}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-textPrimary shadow-sm lg:hidden"
            aria-label="Open admin menu"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary sm:text-xs">
              Store operations
            </p>
            <h1 className="font-display text-lg font-semibold md:text-2xl">
              {sectionLabels[activeSection]}
            </h1>
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
            <input
              aria-label="Search orders and products"
              className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              placeholder="Search products, orders or customers"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-admin-success-light px-3 py-2 text-xs font-bold text-admin-success md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-admin-success" /> Open
          </span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-textMuted transition hover:text-brand-primary shadow-sm"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          <div className="hidden items-center gap-2 rounded-xl bg-white py-2 pl-2 pr-3 shadow-sm md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
              GA
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold">GLAMO Admin</p>
            </div>
            <ChevronDown size={14} className="text-brand-textMuted" />
          </div>
        </div>
      </div>
    </header>
  );
}