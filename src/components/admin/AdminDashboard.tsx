"use client";

import { useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import { ProductsView } from "@/components/admin/products/ProductsView";
import { OrdersView } from "@/components/admin/orders/OrdersView";
import { InventoryView } from "@/components/admin/inventory/InventoryView";
import { BannersView } from "@/components/admin/banners/BannersView";
import { CustomersView } from "@/components/admin/customers/CustomersView";
import { AnalyticsView } from "@/components/admin/analytics/AnalyticsView";
import { SettingsView } from "@/components/admin/settings/SettingsView";
import { AuditLogView } from "@/components/admin/audit/AuditLogView";

export function AdminDashboard() {
  const { activeSection, setActiveSection, sidebarOpen } = useAdminStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    window.location.href = "/admin/login";
  }

  const sectionViews: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    products: <ProductsView />,
    orders: <OrdersView />,
    inventory: <InventoryView />,
    banners: <BannersView />,
    customers: <CustomersView />,
    analytics: <AnalyticsView />,
    audit: <AuditLogView />,
    settings: <SettingsView />,
  };

  return (
    <div className="min-h-screen bg-brand-bgLight text-brand-textPrimary">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isSidebarOpen={sidebarOpen}
        onSidebarClose={() => useAdminStore.getState().setSidebarOpen(false)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {sidebarOpen && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-admin-overlay bg-black/30 lg:hidden"
          onClick={() => useAdminStore.getState().setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-[280px]">
        <AdminHeader
          activeSection={activeSection}
          onMenuToggle={() => useAdminStore.getState().setSidebarOpen(true)}
        />

        <main id="admin-content" aria-label="Admin dashboard" className="p-4 pb-24 md:p-6 md:pb-6 space-y-6">
          {sectionViews[activeSection] || <DashboardView />}
        </main>
      </div>
    </div>
  );
}