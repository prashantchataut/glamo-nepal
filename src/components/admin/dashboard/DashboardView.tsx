"use client";

import { useMemo } from "react";
import type { ComponentType } from "react";

import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { formatNPR } from "@/lib/utils";
import { StatusPill, orderStatusToVariant, stockStatusToVariant } from "@/components/admin/shared/StatusPill";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { useAdminStore } from "@/store/useAdminStore";

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}) {
  return (
    <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={18} />
        </div>
        <span className="font-label rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">
          Live
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-textPrimary">{label}</span>
        <span className="text-brand-textMuted">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-brand-bgLight">
        <div className="h-1.5 rounded-full bg-brand-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-brand-bgLight" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-brand-bgLight" />
      </div>
      <div className="mt-4 h-3 w-20 animate-pulse rounded bg-brand-bgLight" />
      <div className="mt-2 h-7 w-16 animate-pulse rounded bg-brand-bgLight" />
      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-brand-bgLight" />
    </div>
  );
}

export function DashboardView() {
  const { data: stats, isLoading, isError } = useAdminData(() => adminApi.dashboardStats());
  const categoryCounts = useMemo(() => stats?.topPerformers?.categories ?? {}, [stats?.topPerformers?.categories]);
  const maxCategoryCount = useMemo(
    () => Math.max(...Object.values(categoryCounts), 0),
    [categoryCounts]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </section>
      </div>
    );
  }

  if (isError && !stats) {
    return (
      <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">Failed to load dashboard data</p>
        <p className="mt-1 text-xs text-red-600">Please check your connection and try again.</p>
      </section>
    );
  }

  const recentOrders = stats?.recentActivity?.orders ?? [];
  const lowStockProducts = stats?.inventoryAlerts?.lowStockProducts ?? [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-brand-bgDark text-white shadow-lg">
        <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[1fr_0.78fr] xl:items-center">
          <div>
            <span className="font-label inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
              <ShieldCheck size={14} /> Protected workspace
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight md:text-4xl">
              Welcome to GLAMO NEPAL admin.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
              Manage catalog quality, order flow, inventory risks and homepage banners from one operating panel.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => useAdminStore.getState().setActiveSection("products")}
                className="btn-press rounded-full bg-white px-4 py-3 text-sm font-bold text-brand-primary"
              >
                Manage products
              </button>
              <button
                onClick={() => useAdminStore.getState().setActiveSection("banners")}
                className="btn-press rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white"
              >
                Replace banners
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Customers"
          value={stats?.allTime?.customers ?? 0}
          note="Total registered customers"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats?.allTime?.activeProducts ?? 0}
          note="Active catalog products"
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={stats?.allTime?.orders ?? 0}
          note={stats?.today ? `${formatNPR(stats.today.revenue)} today` : "Loading..."}
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock watch"
          value={stats?.inventoryAlerts?.lowStock ?? 0}
          note={stats?.inventoryAlerts ? `${stats.inventoryAlerts.lowStock + stats.inventoryAlerts.outOfStock} items need attention` : "Loading..."}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold">Order history</h3>
              <p className="mt-1 text-sm text-brand-textMuted">Track payment, status and fulfillment.</p>
            </div>
            <button
              onClick={() => useAdminStore.getState().setActiveSection("orders")}
              className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary min-h-[44px]"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            {recentOrders.length > 0 ? (
              <table className="w-full min-w-[700px] text-sm">
                <caption className="sr-only">Recent orders</caption>
                <thead>
                  <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
                    <th scope="col" className="px-4 py-3">Order</th>
                    <th scope="col" className="px-4 py-3">Customer</th>
                    <th scope="col" className="px-4 py-3">Payment</th>
                    <th scope="col" className="px-4 py-3">Total</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-brand-border/70 last:border-0">
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-brand-textPrimary">{order.order_number}</td>
                      <td className="px-4 py-4">{order.customerName ?? "Unknown"}</td>
                      <td className="px-4 py-4">{order.payment_method ?? "N/A"}</td>
                      <td className="px-4 py-4 font-bold">{formatNPR(order.total_amount)}</td>
                      <td className="px-4 py-4">
                        <StatusPill variant={orderStatusToVariant(order.status)}>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-4">
                        <button aria-label="Open order actions" className="flex h-11 w-11 items-center justify-center rounded-full text-brand-textMuted hover:bg-brand-bgLight">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center text-sm text-brand-textMuted">No orders yet. Seed data will appear here.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold">Top categories</h3>
            <div className="mt-4 space-y-4">
              {Object.entries(categoryCounts).length > 0 ? (
                Object.entries(categoryCounts).map(([category, count]) => (
                  <MiniBar key={category} label={category} value={count} max={maxCategoryCount} />
                ))
              ) : (
                <p className="text-sm text-brand-textMuted">No category data yet. Seed data will appear here.</p>
              )}
            </div>
          </div>
          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold">Low-stock alerts</h3>
            <div className="mt-4 space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-brand-bgLight p-3 text-sm">
                    <div>
                      <p className="font-semibold text-brand-textPrimary">{item.name}</p>
                      <p className="text-[11px] text-brand-textMuted">Reorder at {item.low_stock_threshold}</p>
                    </div>
                    <StatusPill variant={stockStatusToVariant(item.stock_quantity <= 0 ? "out" : "low")}>
                      {item.stock_quantity}
                    </StatusPill>
                  </div>
                ))
              ) : (
                <p className="text-sm text-brand-textMuted">No low-stock alerts. All products are well stocked.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}