"use client";

import { DashboardView } from "@/components/admin/dashboard/DashboardView";

/**
 * Backwards-compatible export kept for older imports. The real admin frame now
 * lives in src/app/admin/layout.tsx + AdminShell, so each module has its own URL.
 */
export function AdminDashboard() {
  return <DashboardView />;
}
