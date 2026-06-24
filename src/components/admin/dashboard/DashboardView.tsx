"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ComponentType } from "react";

import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  MoreHorizontal,
  ShieldCheck,
  Truck,
  ImageOff,
  RotateCcw,
} from "lucide-react";
import { formatNPR } from "@/lib/utils";
import { StatusPill, orderStatusToVariant, stockStatusToVariant } from "@/components/admin/shared/StatusPill";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";

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
  const { data: stats, isLoading, isError, refetch } = useAdminData(() => adminApi.dashboardStats());
  const categoryCounts = useMemo(() => stats?.topPerformers?.categories ?? {}, [stats?.topPerformers?.categories]);
  const maxCategoryCount = useMemo(
    () => Math.max(...Object.values(categoryCounts), 0),
    [categoryCounts]
  );

  const recentOrders = stats?.recentActivity?.orders ?? [];
  const lowStockProducts = stats?.inventoryAlerts?.lowStockProducts ?? [];
  const revenueDays = Object.entries(stats?.revenueLast30Days ?? {}).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  const maxRevenue = Math.max(...revenueDays.map(([, d]) => d.revenue), 1);
  const ordersToShip = Number(stats?.orderStatusBreakdown?.PENDING ?? 0) + Number(stats?.orderStatusBreakdown?.CONFIRMED ?? 0) + Number(stats?.orderStatusBreakdown?.PROCESSING ?? 0);
  const todayActions = [
    { label: `${ordersToShip} orders need packing or status update`, note: "Confirm payment, pack orders and move them to shipped.", href: "/admin/orders", icon: Truck, show: ordersToShip > 0 },
    { label: `${stats?.inventoryAlerts?.outOfStock ?? 0} products cannot be bought`, note: "Restock or pause out-of-stock products before customers get stuck.", href: "/admin/inventory", icon: AlertTriangle, show: Number(stats?.inventoryAlerts?.outOfStock ?? 0) > 0 },
    { label: `${stats?.inventoryAlerts?.lowStock ?? 0} products need restock planning`, note: "Review low-stock products and adjust inventory while there is still time.", href: "/admin/inventory", icon: Package, show: Number(stats?.inventoryAlerts?.lowStock ?? 0) > 0 },
    { label: "Check product content quality", note: "Find missing photos, ingredients, shade details and search previews.", href: "/admin/products", icon: ImageOff, show: true },
    { label: "Review returns and hygiene quarantine", note: "Beauty returns should not go back to stock without inspection.", href: "/admin/returns", icon: RotateCcw, show: true },
  ].filter((item) => item.show).slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
  
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Today</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">What needs attention first?</h3>
            <p className="mt-1 text-sm text-brand-textMuted">Plain owner tasks, not technical statuses.</p>
          </div>
          <Link href="/admin/issues" className="btn-press inline-flex w-fit rounded-full bg-brand-primary px-4 py-3 text-sm font-bold text-white">Open issue center</Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {todayActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="rounded-[1.25rem] border border-brand-border p-4 transition hover:bg-brand-bgLight">
                <Icon size={17} className="text-brand-primary" />
                <p className="mt-3 text-sm font-semibold text-brand-textPrimary">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-brand-textMuted">{action.note}</p>
              </Link>
            );
          })}
        </div>
      </section>

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
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-bgDark"
        >
          Retry
        </button>
      </section>
    );
  }

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
              <Link
                href="/admin/products"
                className="btn-press rounded-full bg-white px-4 py-3 text-sm font-bold text-brand-primary"
              >
                Manage products
              </Link>
              <Link
                href="/admin/content"
                className="btn-press rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white"
              >
                Update content
              </Link>
            </div>
          </div>
        </div>
      </section>


      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Today</p>
            <h3 className="mt-1 font-display text-2xl font-semibold">What needs attention first?</h3>
            <p className="mt-1 text-sm text-brand-textMuted">Plain owner tasks, not technical statuses.</p>
          </div>
          <Link href="/admin/issues" className="btn-press inline-flex w-fit rounded-full bg-brand-primary px-4 py-3 text-sm font-bold text-white">Open issue center</Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {todayActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href} className="rounded-[1.25rem] border border-brand-border p-4 transition hover:bg-brand-bgLight">
                <Icon size={17} className="text-brand-primary" />
                <p className="mt-3 text-sm font-semibold text-brand-textPrimary">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-brand-textMuted">{action.note}</p>
              </Link>
            );
          })}
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
            <Link
              href="/admin/orders"
              className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary min-h-[44px]"
            >
              View all
            </Link>
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
                        <Link href={`/admin/orders?search=${encodeURIComponent(order.order_number)}`} aria-label="Open order" className="flex h-11 w-11 items-center justify-center rounded-full text-brand-textMuted hover:bg-brand-bgLight">
                          <MoreHorizontal size={16} />
                        </Link>
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
          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold">Revenue pulse</h3>
            <p className="mt-1 text-sm text-brand-textMuted">Last 14 paid-sales days from the order table.</p>
            <div className="mt-5 flex h-32 items-end gap-1.5">
              {revenueDays.length > 0 ? revenueDays.map(([date, d]) => (
                <div key={date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-brand-primary" style={{ height: `${Math.max(8, Math.round((d.revenue / maxRevenue) * 100))}%` }} title={`${date}: ${formatNPR(d.revenue)}`} />
                  <span className="text-[10px] text-brand-textMuted">{date.slice(5)}</span>
                </div>
              )) : <p className="self-center text-sm text-brand-textMuted">No paid revenue yet.</p>}
            </div>
          </div>
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