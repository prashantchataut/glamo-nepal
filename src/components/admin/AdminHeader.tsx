"use client";

import { useCallback, useState } from "react";
import { Menu, ChevronDown, Search, X } from "lucide-react";
import type { AdminSection } from "@/store/useAdminStore";
import { useAdminStore } from "@/store/useAdminStore";
import { NotificationDropdown } from "@/components/admin/AdminNotifications";

const sectionLabels: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  inventory: "Stocks",
  banners: "Banners",
  coupons: "Coupons",
  popups: "Popups",
  gallery: "Gallery",
  team: "Team",
  customers: "Customers",
  analytics: "Analytics",
  audit: "Audit Log",
  settings: "Settings",
};

interface AdminHeaderProps {
  activeSection: AdminSection;
  onMenuToggle: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminHeader({ activeSection, onMenuToggle }: AdminHeaderProps) {
  const { globalSearch, setGlobalSearch, setActiveSection, setProductSearch, setCustomerSearch, adminUser } = useAdminStore();
  const displayName = adminUser?.name || "Admin";
  const initials = getInitials(displayName);
  const [localSearch, setLocalSearch] = useState(globalSearch);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = localSearch.trim();
    if (!query) return;

    setGlobalSearch(query);
    setProductSearch(query);
    setCustomerSearch(query);

    if (activeSection === "dashboard" || activeSection === "banners" || activeSection === "inventory" || activeSection === "analytics" || activeSection === "settings" || activeSection === "audit") {
      setActiveSection("products");
    }
    setMobileSearchOpen(false);
  }, [localSearch, activeSection, setGlobalSearch, setProductSearch, setCustomerSearch, setActiveSection]);

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
        <form onSubmit={handleSearch} className="hidden flex-1 items-center justify-center md:flex">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
            <input
              aria-label="Search orders and products"
              className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              placeholder="Search products, orders or customers"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </form>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-textMuted transition hover:text-brand-primary shadow-sm md:hidden"
            aria-label="Search"
          >
            {mobileSearchOpen ? <X size={16} /> : <Search size={16} />}
          </button>
          <span className="hidden items-center gap-2 rounded-full bg-admin-success-light px-3 py-2 text-xs font-bold text-admin-success md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-admin-success" /> Open
          </span>
          <NotificationDropdown />
          <div className="hidden items-center gap-2 rounded-xl bg-white py-2 pl-2 pr-3 shadow-sm md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold">{displayName}</p>
            </div>
            <ChevronDown size={14} className="text-brand-textMuted" />
          </div>
        </div>

        {mobileSearchOpen && (
          <form onSubmit={handleSearch} className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
              <input
                aria-label="Search products, orders or customers"
                className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="Search products, orders or customers"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                autoFocus
              />
            </div>
          </form>
        )}
      </div>
    </header>
  );
}