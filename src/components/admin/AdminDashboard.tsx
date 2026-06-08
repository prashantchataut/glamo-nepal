"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";

const ProductsView = lazy(() => import("@/components/admin/products/ProductsView").then(m => ({ default: m.ProductsView })));
const OrdersView = lazy(() => import("@/components/admin/orders/OrdersView").then(m => ({ default: m.OrdersView })));
const InventoryView = lazy(() => import("@/components/admin/inventory/InventoryView").then(m => ({ default: m.InventoryView })));
const BannersView = lazy(() => import("@/components/admin/banners/BannersView").then(m => ({ default: m.BannersView })));
const BlogsView = lazy(() => import("@/components/admin/blog/BlogsView").then(m => ({ default: m.BlogsView })));
const CouponsView = lazy(() => import("@/components/admin/coupons/CouponListView").then(m => ({ default: m.CouponsView })));
const PopupsView = lazy(() => import("@/components/admin/popups/PopupsView").then(m => ({ default: m.PopupsView })));
const GalleryView = lazy(() => import("@/components/admin/gallery/GalleryView").then(m => ({ default: m.GalleryView })));
const TeamView = lazy(() => import("@/components/admin/team/TeamView").then(m => ({ default: m.TeamView })));
const CustomersView = lazy(() => import("@/components/admin/customers/CustomersView").then(m => ({ default: m.CustomersView })));
const AnalyticsView = lazy(() => import("@/components/admin/analytics/AnalyticsView").then(m => ({ default: m.AnalyticsView })));
const SettingsView = lazy(() => import("@/components/admin/settings/SettingsView").then(m => ({ default: m.SettingsView })));
const AuditLogView = lazy(() => import("@/components/admin/audit/AuditLogView").then(m => ({ default: m.AuditLogView })));

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
        <p className="mt-3 text-sm text-brand-textMuted">Loading...</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { activeSection, setActiveSection, sidebarOpen } = useAdminStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/dashboard", { credentials: "include" })
      .then((res) => {
        if (!cancelled) setAuthed(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authed === false) {
      window.location.href = "/admin/login";
    }
  }, [authed]);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
          <p className="mt-3 text-sm text-brand-textMuted">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!authed) return null;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
    } catch {}
    window.location.href = "/admin/login";
  }

  const sectionViews: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    products: <ComponentErrorBoundary name="products"><Suspense fallback={<SectionLoader />}><ProductsView /></Suspense></ComponentErrorBoundary>,
    orders: <ComponentErrorBoundary name="orders"><Suspense fallback={<SectionLoader />}><OrdersView /></Suspense></ComponentErrorBoundary>,
    inventory: <ComponentErrorBoundary name="inventory"><Suspense fallback={<SectionLoader />}><InventoryView /></Suspense></ComponentErrorBoundary>,
    banners: <ComponentErrorBoundary name="banners"><Suspense fallback={<SectionLoader />}><BannersView /></Suspense></ComponentErrorBoundary>,
    blogs: <ComponentErrorBoundary name="blogs"><Suspense fallback={<SectionLoader />}><BlogsView /></Suspense></ComponentErrorBoundary>,
    coupons: <ComponentErrorBoundary name="coupons"><Suspense fallback={<SectionLoader />}><CouponsView /></Suspense></ComponentErrorBoundary>,
    popups: <ComponentErrorBoundary name="popups"><Suspense fallback={<SectionLoader />}><PopupsView /></Suspense></ComponentErrorBoundary>,
    gallery: <ComponentErrorBoundary name="gallery"><Suspense fallback={<SectionLoader />}><GalleryView /></Suspense></ComponentErrorBoundary>,
    team: <ComponentErrorBoundary name="team"><Suspense fallback={<SectionLoader />}><TeamView /></Suspense></ComponentErrorBoundary>,
    customers: <ComponentErrorBoundary name="customers"><Suspense fallback={<SectionLoader />}><CustomersView /></Suspense></ComponentErrorBoundary>,
    analytics: <ComponentErrorBoundary name="analytics"><Suspense fallback={<SectionLoader />}><AnalyticsView /></Suspense></ComponentErrorBoundary>,
    audit: <ComponentErrorBoundary name="audit"><Suspense fallback={<SectionLoader />}><AuditLogView /></Suspense></ComponentErrorBoundary>,
    settings: <ComponentErrorBoundary name="settings"><Suspense fallback={<SectionLoader />}><SettingsView /></Suspense></ComponentErrorBoundary>,
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