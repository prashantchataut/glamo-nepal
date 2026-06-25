"use client";

import { ComponentType } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  Ticket,
  Users,
  BarChart3,
  Settings,
  Eye,
  LogOut,
  X,
  ClipboardList,
  RotateCcw,
  Star,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Download,
  MousePointerClick,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSection, canAccess } from "@/store/useAdminStore";
import { useAdminStore } from "@/store/useAdminStore";

interface AdminSidebarProps {
  activeSection: AdminSection;
  isSidebarOpen: boolean;
  onSidebarClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const sections: Array<{
  id: AdminSection;
  label: string;
  href: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "products", label: "Products", href: "/admin/products", icon: Package },
  { id: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { id: "customers", label: "Customers", href: "/admin/customers", icon: Users },
  { id: "inventory", label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { id: "delivery", label: "Delivery", href: "/admin/delivery", icon: Truck },
  { id: "promotions", label: "Promotions", href: "/admin/promotions", icon: Ticket },
  { id: "returns", label: "Returns", href: "/admin/returns", icon: RotateCcw },
  { id: "reviews", label: "Reviews", href: "/admin/reviews", icon: Star },
  { id: "content", label: "Homepage", href: "/admin/content", icon: FileText },
  { id: "popups", label: "Popups", href: "/admin/popups", icon: MousePointerClick },
  { id: "support", label: "Support Desk", href: "/admin/support", icon: LifeBuoy },
  { id: "analytics", label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { id: "audit", label: "Audit Log", href: "/admin/audit", icon: ClipboardList },
  { id: "backups", label: "Backups", href: "/admin/backups", icon: Download },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
];

function SparklesIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  );
}

const SECTION_ACCESS: Record<AdminSection, string> = {
  dashboard: "ADMIN",
  products: "ADMIN",
  orders: "ADMIN",
  customers: "ADMIN",
  inventory: "ADMIN",
  delivery: "ADMIN",
  promotions: "ADMIN",
  returns: "ADMIN",
  reviews: "ADMIN",
  popups: "ADMIN",
  setup: "ADMIN",
  support: "ADMIN",
  backups: "ADMIN",
  content: "ADMIN",
  analytics: "ADMIN",
  audit: "SUPER_ADMIN",
  settings: "ADMIN",
};

export function AdminSidebar({
  activeSection,
  isSidebarOpen,
  onSidebarClose,
  onLogout,
  isLoggingOut,
}: AdminSidebarProps) {
  const adminUser = useAdminStore((s) => s.adminUser);
  const userRole = adminUser?.role || "ADMIN";
  const visibleSections = sections.filter((s) => canAccess(userRole, SECTION_ACCESS[s.id]));

  return (
    <aside
      role="navigation"
      aria-label="Admin navigation"
      className={cn(
        "fixed inset-y-0 left-0 z-menu w-[280px] border-r border-brand-border bg-white/95 shadow-xl transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-6">
          <Link href="/admin" className="flex items-center gap-4" onClick={onSidebarClose}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/20">
              <SparklesIcon />
            </div>
            <div>
              <p className="font-display text-xl font-semibold leading-none">GLAMO</p>
              <p className="font-label mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-textMuted">
                Admin panel
              </p>
            </div>
          </Link>
          <button
            onClick={onSidebarClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-textMuted hover:bg-brand-bgLight lg:hidden"
            aria-label="Close admin menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={active ? "page" : undefined}
                onClick={onSidebarClose}
                className={cn(
                  "btn-press flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
                  active
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "text-brand-textMuted hover:bg-brand-bgLight hover:text-brand-textPrimary"
                )}
              >
                <Icon size={17} />
                {section.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-brand-border p-4">
          <Link
            href="/"
            className="mb-1 flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-primary"
          >
            <Eye size={17} /> View storefront
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="btn-press flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-admin-error transition hover:bg-admin-error-light"
          >
            <LogOut size={17} /> {isLoggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
}
