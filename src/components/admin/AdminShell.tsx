"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAdminStore, type AdminSection } from "@/store/useAdminStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ensureCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";

const PATH_SECTION: Array<[RegExp, AdminSection]> = [
  [/^\/admin\/products(?:\/|$)/, "products"],
  [/^\/admin\/orders(?:\/|$)/, "orders"],
  [/^\/admin\/customers(?:\/|$)/, "customers"],
  [/^\/admin\/inventory(?:\/|$)/, "inventory"],
  [/^\/admin\/delivery(?:\/|$)/, "delivery"],
  [/^\/admin\/promotions(?:\/|$)/, "promotions"],
  [/^\/admin\/returns(?:\/|$)/, "returns"],
  [/^\/admin\/reviews(?:\/|$)/, "reviews"],
  [/^\/admin\/popups(?:\/|$)/, "popups"],
  [/^\/admin\/support(?:\/|$)/, "support"],
  [/^\/admin\/backups(?:\/|$)/, "backups"],
  [/^\/admin\/analytics(?:\/|$)/, "analytics"],
  [/^\/admin\/settings(?:\/|$)/, "settings"],
  [/^\/admin\/audit(?:\/|$)/, "audit"],
  [/^\/admin\/content(?:\/|$)/, "content"],
];

function sectionFromPath(pathname: string): AdminSection {
  for (const [pattern, section] of PATH_SECTION) {
    if (pattern.test(pathname)) return section;
  }
  return "dashboard";
}

function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-border border-t-brand-primary" />
        <p className="mt-3 text-sm text-brand-textMuted">{label}</p>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const activeSection = useMemo(() => sectionFromPath(pathname), [pathname]);
  const { sidebarOpen, setAdminUser, setActiveSection, setSidebarOpen } = useAdminStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setActiveSection(activeSection);
  }, [activeSection, setActiveSection]);

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
          if (data?.data) setAdminUser(data.data);
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
        setAuthed(false);
        setAuthError(err?.name === "AbortError" ? "Request timed out. Please try again." : "Could not connect to server. Please try again.");
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [setAdminUser]);

  useEffect(() => {
    if (pathname.startsWith("/admin/login")) return;
    const cleanup = verifySession();
    return cleanup;
  }, [pathname, verifySession]);

  useEffect(() => {
    if (pathname.startsWith("/admin/login")) return;
    if (authed === false) {
      const timer = setTimeout(() => {
        window.location.href = "/admin/login";
      }, authError ? 3000 : 0);
      return () => clearTimeout(timer);
    }
  }, [authed, authError, pathname]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const csrfToken = await ensureCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
      await fetch("/api/admin/login", { method: "DELETE", headers, credentials: "include" });
    } catch {
      // Continue with local logout even if the backend cannot be reached.
    }
    useAdminStore.getState().setAdminUser(null);
    window.location.href = "/admin/login";
  }

  if (pathname.startsWith("/admin/login")) {
    return <div className="min-h-screen bg-brand-bgLight">{children}</div>;
  }

  if (authed === null) {
    return <FullPageLoader label="Verifying session..." />;
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
        <div className="max-w-sm text-center">
          <p className="text-sm text-red-600">{authError || "Session expired"}</p>
          <button
            type="button"
            onClick={() => verifySession()}
            className="mt-4 rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-neutral-50 transition hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bgLight text-brand-textPrimary">
      <AdminSidebar
        activeSection={activeSection}
        isSidebarOpen={sidebarOpen}
        onSidebarClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {sidebarOpen && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-admin-overlay bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-[280px]">
        <AdminHeader activeSection={activeSection} onMenuToggle={() => setSidebarOpen(true)} />
        <main id="admin-content" aria-label="Admin workspace" className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
