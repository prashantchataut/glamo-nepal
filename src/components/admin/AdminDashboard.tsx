"use client";

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";
import { ensureCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";

const ProductsView = lazy(() => import("@/components/admin/products/ProductsView").then(m => ({ default: m.ProductsView })));
const OrdersView = lazy(() => import("@/components/admin/orders/OrdersView").then(m => ({ default: m.OrdersView })));
const InventoryView = lazy(() => import("@/components/admin/inventory/InventoryView").then(m => ({ default: m.InventoryView })));
const BannersView = lazy(() => import("@/components/admin/banners/BannersView").then(m => ({ default: m.BannersView })));
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
  const { activeSection, setActiveSection, sidebarOpen, setAdminUser } = useAdminStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifySession = useCallback(() => {
    setAuthed(null);
    setAuthError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch("/api/admin/me", { credentials: "include", signal: controller.signal })
      .then(async (res) => {
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data?.data) {
            setAdminUser(data.data);
          }
          setAuthed(true);
          setAuthError(null);
        } else if (res.status === 401) {
          setAuthed(false);
          setAuthError("Session expired. Please sign in again.");
        } else {
          setAuthed(false);
          setAuthError("Could not verify session. Please try again.");
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error("[AdminDashboard] Session verification failed:", err);
        setAuthed(false);
        setAuthError(err.name === "AbortError" ? "Request timed out. Please try again." : "Could not connect to server. Please try again.");
      });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [setAdminUser]);

  useEffect(() => {
    const cleanup = verifySession();
    return cleanup;
  }, [verifySession]);

  useEffect(() => {
    if (authed === false) {
      const timer = setTimeout(() => {
        window.location.href = "/admin/login";
      }, authError ? 3000 : 0);
      return () => clearTimeout(timer);
    }
  }, [authed, authError]);

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

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
        <div className="max-w-sm text-center">
          <p className="text-sm text-red-600">{authError || "Session expired"}</p>
          <button
            type="button"
            onClick={() => { verifySession(); }}
            className="mt-4 rounded-full bg-neutral-950 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const csrfToken = await ensureCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
      await fetch("/api/admin/login", { method: "DELETE", headers, credentials: "include" });
    } catch {}
    useAdminStore.getState().setAdminUser(null);
    window.location.href = "/admin/login";
  }

  const sectionViews: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    products: <ComponentErrorBoundary name="products"><Suspense fallback={<SectionLoader />}><ProductsView /></Suspense></ComponentErrorBoundary>,
    orders: <ComponentErrorBoundary name="orders"><Suspense fallback={<SectionLoader />}><OrdersView /></Suspense></ComponentErrorBoundary>,
    inventory: <ComponentErrorBoundary name="inventory"><Suspense fallback={<SectionLoader />}><InventoryView /></Suspense></ComponentErrorBoundary>,
    banners: <ComponentErrorBoundary name="banners"><Suspense fallback={<SectionLoader />}><BannersView /></Suspense></ComponentErrorBoundary>,
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