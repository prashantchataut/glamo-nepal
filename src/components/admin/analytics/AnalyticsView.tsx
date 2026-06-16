/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { formatNPR } from "@/lib/utils";
import { TrendingUp, ShoppingCart, Package } from "lucide-react";
import type { ComponentType } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ORDER_STATUS_COLORS = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
} as const;

const CHART_COLORS = {
  grid: "#e5e7eb",
  axisText: "#6b7280",
  revenue: "#6366f1",
  fallback: "#6b7280",
} as const;

type DateRange = "7d" | "30d" | "month" | "custom";

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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: ComponentType<{ size?: number | string; className?: string }> }) {
  return (
    <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={18} />
        </div>
        <span className="font-label rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">Live</span>
      </div>
      <p className="mt-4 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}

export function AnalyticsView() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { data: stats, isLoading: statsLoading, isError: statsIsError } = useAdminData(() => adminApi.dashboardStats());
  const { start, end } = getDateRange(dateRange);
  const { data: sales, isLoading: salesLoading, isError: salesIsError } = useAdminData(() => adminApi.getSalesReport(start, end, "day"));

  const statsError = statsIsError ? "Failed to load analytics" : null;
  const salesError = salesIsError ? "Failed to load sales data" : null;

  const revenueChartData = useMemo(() => {
    if (!sales?.revenueByPeriod) return [];
    return Object.entries(sales.revenueByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date: date.slice(5), revenue: data.revenue, orders: data.orders }));
  }, [sales]);

  const orderStatusData = useMemo(() => {
    if (!stats?.orderStatusBreakdown) return [];
    return Object.entries(stats.orderStatusBreakdown).map(([status, count]) => ({
      name: status.charAt(0) + status.slice(1).toLowerCase(),
      value: count,
      color: (ORDER_STATUS_COLORS as Record<string, string>)[status] ?? CHART_COLORS.fallback,
    }));
  }, [stats]);

  const topProducts = useMemo(() => (stats as unknown as Record<string, unknown> | undefined)?.topPerformers && typeof (stats as unknown as Record<string, unknown>).topPerformers === "object" ? ((stats as unknown as Record<string, unknown>).topPerformers as unknown as Record<string, unknown>)?.products as unknown as Record<string, unknown>[] ?? [] : [], [stats]);
  const maxSold = useMemo(() => Math.max(...topProducts.map((p) => (p as unknown as Record<string, unknown>).totalSold as number ?? 0), 1), [topProducts]);

  const categoryBreakdown = useMemo(() => {
    const cats = (stats as unknown as Record<string, unknown>)?.topPerformers && typeof (stats as unknown as Record<string, unknown>).topPerformers === "object"
      ? ((stats as unknown as Record<string, unknown>).topPerformers as Record<string, number>) : null;
    if (!cats) return [];
    return Object.entries(cats).sort(([, a], [, b]) => b - a);
  }, [stats]);

  const maxCategory = useMemo(() => Math.max(...categoryBreakdown.map(([, v]) => v), 1), [categoryBreakdown]);

  if (statsError && !stats) {
    return <ErrorState message={statsError} />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Analytics</h2>
          <p className="mt-0.5 text-sm text-brand-textMuted">Revenue, products and category performance.</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "month"] as unknown as DateRange[]).map((range) => (
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

      {statsLoading ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-brand-border bg-white p-6">
              <div className="h-4 w-16 animate-pulse rounded bg-brand-border/50" />
              <div className="mt-4 h-8 w-24 animate-pulse rounded bg-brand-border/50" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          <StatCard icon={TrendingUp} label="Revenue (30d)" value={formatNPR(stats.thisMonth?.revenue ?? 0)} note="Current period" />
          <StatCard icon={ShoppingCart} label="Orders (30d)" value={stats.thisMonth?.orders ?? 0} note="Current period" />
          <StatCard icon={Package} label="Active products" value={stats.allTime?.activeProducts ?? 0} note="Total catalog" />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-semibold">Revenue trend</h3>
          {salesLoading ? (
            <div className="mt-4 h-64 animate-pulse rounded bg-brand-bgLight" />
          ) : salesError ? (
            <ErrorState message={salesError} />
          ) : revenueChartData.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip formatter={(value) => [formatNPR(Number(value)), "Revenue"]} labelFormatter={(label) => label} />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} fill={CHART_COLORS.revenue} fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-textMuted">No revenue data for this period.</p>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
            <h3 className="font-display text-xl font-semibold">Order status</h3>
            {statsLoading ? (
              <div className="mt-4 h-48 animate-pulse rounded bg-brand-bgLight" />
            ) : orderStatusData.length > 0 ? (
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name">
                      {orderStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} orders`, "Orders"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {orderStatusData.map((entry) => (
                    <span key={entry.name} className="flex items-center gap-1 text-xs text-brand-textMuted">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-brand-textMuted">No order data yet.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
            <h3 className="font-display text-xl font-semibold">Top products</h3>
            {statsLoading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-brand-bgLight" />
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="mt-4 space-y-3">
                {topProducts.map((product, i) => (
                  <MiniBar key={i} label={String((product as unknown as Record<string, unknown>).name ?? "")} value={Number((product as unknown as Record<string, unknown>).totalSold ?? 0)} max={maxSold} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-brand-textMuted">No product data yet.</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
            <h3 className="font-display text-xl font-semibold">Categories</h3>
            {statsLoading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-brand-bgLight" />
                ))}
              </div>
            ) : categoryBreakdown.length > 0 ? (
              <div className="mt-4 space-y-3">
                {categoryBreakdown.map(([category, count]) => (
                  <MiniBar key={category} label={category} value={count as number} max={maxCategory} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-brand-textMuted">No category data yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}