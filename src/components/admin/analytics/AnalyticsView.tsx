/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { formatNPR } from "@/lib/utils";
import { TrendingUp, TrendingDown, ShoppingCart, Package, Users, Receipt, Wallet } from "lucide-react";
import type { ComponentType } from "react";
import {
  Area, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

// ── Visual constants ────────────────────────────────────────────────────────
const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
};

const PAYMENT_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6"];

const CHART_COLORS = {
  grid: "#e5e7eb",
  axisText: "#6b7280",
  revenue: "#6366f1",
  orders: "#ec4899",
  fallback: "#6b7280",
} as const;

type DateRange = "7d" | "30d" | "month";

function rangeShortLabel(range: DateRange): string {
  return range === "7d" ? "7d" : range === "30d" ? "30d" : "month";
}

function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  let start: Date;
  switch (range) {
    case "7d":
      start = new Date(now.getTime() - 7 * 86400000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 86400000);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      start = new Date(now.getTime() - 30 * 86400000);
  }
  return { start: start.toISOString().slice(0, 10), end };
}

// Compute the equivalent *previous* period so KPI cards can show a trend delta.
function getPreviousRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  if (range === "month") {
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      start: prevStart.toISOString().slice(0, 10),
      end: new Date(firstOfThisMonth.getTime() - 86400000).toISOString().slice(0, 10),
    };
  }
  const startOffsetDays = range === "7d" ? 14 : 60;
  const endOffsetDays = range === "7d" ? 7 : 30;
  return {
    start: new Date(now.getTime() - startOffsetDays * 86400000).toISOString().slice(0, 10),
    end: new Date(now.getTime() - endOffsetDays * 86400000).toISOString().slice(0, 10),
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // undefined growth when no baseline
  return ((current - previous) / previous) * 100;
}

function formatDelta(delta: number | null): { text: string; positive: boolean } | null {
  if (delta === null) return null;
  const sign = delta >= 0 ? "+" : "";
  return { text: `${sign}${delta.toFixed(1)}%`, positive: delta >= 0 };
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Small presentational helpers ────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
    </div>
  );
}

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm", className)}>
      <div>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-brand-textMuted">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  label, value, note, icon: Icon, delta,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  delta?: { text: string; positive: boolean } | null;
}) {
  return (
    <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-brand-primary-light p-2.5 text-brand-primary">
          <Icon size={16} />
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
              delta.positive ? "bg-admin-success-light text-admin-success" : "bg-admin-error-light text-admin-error"
            )}
          >
            {delta.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta.text}
          </span>
        ) : (
          <span className="font-label rounded-full bg-brand-bgLight px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-textMuted">Live</span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}

function HBar({ label, value, max, formatter }: { label: string; value: number; max: number; formatter?: (v: number) => string }) {
  const width = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="truncate font-medium text-brand-textPrimary" title={label}>{label}</span>
        <span className="ml-2 shrink-0 text-brand-textMuted">{formatter ? formatter(value) : value}</span>
      </div>
      <div className="h-2 rounded-full bg-brand-bgLight">
        <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// ── Shared tooltip styling ──────────────────────────────────────────────────
const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  fontSize: "12px",
} as const;

// ── Main view ───────────────────────────────────────────────────────────────
export function AnalyticsView() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { data: stats, isLoading: statsLoading, isError: statsIsError } = useAdminData(() => adminApi.dashboardStats());
  const { start, end } = getDateRange(dateRange);
  const { data: sales, isLoading: salesLoading, isError: salesIsError } = useAdminData(
    () => adminApi.getSalesReport(start, end, "day"),
    { deps: [start, end] }
  );
  const { start: prevStart, end: prevEnd } = getPreviousRange(dateRange);
  const { data: prevSales } = useAdminData(
    () => adminApi.getSalesReport(prevStart, prevEnd, "day"),
    { deps: [prevStart, prevEnd] }
  );

  const statsError = statsIsError ? "Failed to load analytics" : null;
  const salesError = salesIsError ? "Failed to load sales data" : null;

  // ── Revenue + orders combo chart ──────────────────────────────────────────
  const revenueChartData = useMemo(() => {
    if (!sales?.revenueByPeriod) return [];
    return Object.entries(sales.revenueByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date: date.slice(5), revenue: d.revenue, orders: d.orders }));
  }, [sales]);

  // ── Order-status donut ────────────────────────────────────────────────────
  const orderStatusData = useMemo(() => {
    if (!stats?.orderStatusBreakdown) return [];
    return Object.entries(stats.orderStatusBreakdown)
      .filter(([, c]) => Number(c) > 0)
      .map(([status, count]) => ({
        name: status.charAt(0) + status.slice(1).toLowerCase(),
        value: count,
        color: ORDER_STATUS_COLORS[status] ?? CHART_COLORS.fallback,
      }));
  }, [stats]);

  // ── Payment-method breakdown (revenue) ────────────────────────────────────
  const paymentData = useMemo(() => {
    if (!sales?.paymentMethodBreakdown) return [];
    return Object.entries(sales.paymentMethodBreakdown)
      .filter(([, v]) => Number((v as any)?.orders ?? 0) > 0)
      .map(([method, v]) => ({
        method: String(method).toLowerCase(),
        revenue: Number((v as any)?.revenue ?? 0),
        orders: Number((v as any)?.orders ?? 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  // ── Top products ──────────────────────────────────────────────────────────
  const topProducts = useMemo(() => {
    const performers = (stats as any)?.topPerformers;
    const list = Array.isArray(performers?.products) ? performers.products : [];
    return (list as Array<Record<string, unknown>>).map((p) => ({
      name: String(p?.name ?? "Unknown"),
      totalSold: Number(p?.totalSold ?? 0),
    }));
  }, [stats]);
  const maxSold = useMemo(() => Math.max(...topProducts.map((p) => p.totalSold), 1), [topProducts]);

  // ── Category breakdown (FIXED: read topPerformers.categories, not topPerformers) ──
  const categoryBreakdown = useMemo(() => {
    const performers = (stats as any)?.topPerformers;
    const cats = performers?.categories && typeof performers.categories === "object" ? performers.categories : null;
    if (!cats) return [];
    return (Object.entries(cats) as Array<[string, number]>)
      .filter(([, v]) => Number(v) > 0)
      .sort(([, a], [, b]) => Number(b) - Number(a));
  }, [stats]);
  const maxCategory = useMemo(() => Math.max(...categoryBreakdown.map(([, v]) => v), 1), [categoryBreakdown]);

  // ── KPI deltas vs previous period ─────────────────────────────────────────
  const periodRevenue = Number(sales?.totalRevenue ?? 0);
  const periodOrders = Number(sales?.totalOrders ?? 0);
  const prevRevenue = Number(prevSales?.totalRevenue ?? 0);
  const prevOrders = Number(prevSales?.totalOrders ?? 0);
  const aov = periodOrders > 0 ? periodRevenue / periodOrders : 0;
  const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;

  const revenueDelta = formatDelta(pctChange(periodRevenue, prevRevenue));
  const ordersDelta = formatDelta(pctChange(periodOrders, prevOrders));
  const aovDelta = formatDelta(pctChange(aov, prevAov));

  if (statsError && !stats) {
    return <ErrorState message={statsError} />;
  }

  const rangeLabel = dateRange === "7d" ? "Last 7 days" : dateRange === "30d" ? "Last 30 days" : "This month";

  return (
    <section className="space-y-6">
      {/* Header + range switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Analytics</h2>
          <p className="mt-0.5 text-sm text-brand-textMuted">Revenue, orders, products and category performance - live from your store.</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "month"] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                dateRange === range
                  ? "bg-brand-primary text-white"
                  : "border border-brand-border text-brand-textMuted hover:bg-brand-bgLight"
              )}
            >
              {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "This month"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      {statsLoading ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-brand-border bg-white p-5">
              <div className="h-4 w-16 animate-pulse rounded bg-brand-border/50" />
              <div className="mt-4 h-8 w-24 animate-pulse rounded bg-brand-border/50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard icon={Wallet} label={`Revenue (${rangeShortLabel(dateRange)})`} value={formatNPR(periodRevenue)} note="Paid orders in this period" delta={revenueDelta} />
          <KpiCard icon={ShoppingCart} label={`Orders (${rangeShortLabel(dateRange)})`} value={periodOrders} note="Total orders placed" delta={ordersDelta} />
          <KpiCard icon={Receipt} label="Avg. order value" value={formatNPR(aov)} note="Revenue ÷ orders" delta={aovDelta} />
          <KpiCard icon={Users} label="Customers" value={stats?.allTime?.customers ?? 0} note="All-time active customers" />
          <KpiCard icon={Package} label="Active products" value={stats?.allTime?.activeProducts ?? 0} note="Live in your catalog" />
        </div>
      )}

      {/* Revenue + Orders combo chart (full width) */}
      <Card title="Revenue & orders trend" subtitle={rangeLabel}>
        {salesLoading ? (
          <div className="mt-4 h-72 animate-pulse rounded bg-brand-bgLight" />
        ) : salesError ? (
          <ErrorState message={salesError} />
        ) : revenueChartData.length > 0 ? (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} tickLine={false} axisLine={{ stroke: CHART_COLORS.grid }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) =>
                    name === "revenue" ? [formatNPR(Number(value)), "Revenue"] : [`${value}`, "Orders"]
                  }
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} fill="url(#revenueGradient)" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke={CHART_COLORS.orders} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-4 text-sm text-brand-textMuted">No revenue data for this period yet. Orders will appear here as they come in.</p>
        )}
        {revenueChartData.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-brand-textMuted">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.revenue }} />Revenue (NPR)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.orders }} />Orders</span>
          </div>
        )}
      </Card>

      {/* Two-up: Order status donut + Payment methods */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Orders by status" subtitle="All-time distribution">
          {statsLoading ? (
            <div className="mt-4 h-56 animate-pulse rounded bg-brand-bgLight" />
          ) : orderStatusData.length > 0 ? (
            <div className="mt-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" nameKey="name">
                      {orderStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} orders`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {orderStatusData.map((entry) => (
                  <span key={entry.name} className="flex items-center gap-1.5 text-xs text-brand-textMuted">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name} <span className="font-semibold text-brand-textPrimary">{entry.value}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-textMuted">No order data yet.</p>
          )}
        </Card>

        <Card title="Revenue by payment method" subtitle={rangeLabel}>
          {salesLoading ? (
            <div className="mt-4 h-56 animate-pulse rounded bg-brand-bgLight" />
          ) : paymentData.length > 0 ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} tickLine={false} axisLine={false} width={70} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => name === "revenue" ? [formatNPR(Number(value)), "Revenue"] : [`${value}`, "Orders"]}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-textMuted">No payment data for this period.</p>
          )}
        </Card>
      </div>

      {/* Two-up: Top products + Categories */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Top selling products" subtitle="By units sold (all-time)">
          {statsLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-brand-bgLight" />
              ))}
            </div>
          ) : topProducts.length > 0 ? (
            <div className="mt-4 space-y-3.5">
              {topProducts.slice(0, 8).map((p) => (
                <HBar key={p.name} label={p.name} value={p.totalSold} max={maxSold} formatter={(v) => `${v} sold`} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-textMuted">No product sales yet. Once orders come in, your best sellers appear here.</p>
          )}
        </Card>

        <Card title="Sales by category" subtitle="By units sold (all-time)">
          {statsLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-brand-bgLight" />
              ))}
            </div>
          ) : categoryBreakdown.length > 0 ? (
            <div className="mt-4 space-y-3.5">
              {categoryBreakdown.slice(0, 8).map(([category, count]) => (
                <HBar key={category} label={category} value={count} max={maxCategory} formatter={(v) => `${v} units`} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-textMuted">No category data yet. Add categories to your products to see this breakdown.</p>
          )}
        </Card>
      </div>

      {/* Inventory health strip */}
      {!statsLoading && stats?.inventoryAlerts && (stats.inventoryAlerts.lowStock > 0 || stats.inventoryAlerts.outOfStock > 0) ? (
        <Card title="Inventory health" subtitle="Action needed">
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {stats.inventoryAlerts.outOfStock > 0 && (
              <div className="rounded-2xl border border-admin-error/20 bg-admin-error-light/40 p-4">
                <p className="text-sm font-semibold text-admin-error">{stats.inventoryAlerts.outOfStock} out of stock</p>
                <p className="mt-1 text-xs text-brand-textMuted">These products can't be purchased until restocked.</p>
              </div>
            )}
            {stats.inventoryAlerts.lowStock > 0 && (
              <div className="rounded-2xl border border-admin-warning/20 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-700">{stats.inventoryAlerts.lowStock} running low</p>
                <p className="mt-1 text-xs text-brand-textMuted">At or below their reorder threshold.</p>
              </div>
            )}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
