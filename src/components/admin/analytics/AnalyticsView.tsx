"use client";

import { useCallback, useMemo, useState } from "react";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi, type DashboardStats, type SalesReport } from "@/lib/api/admin";
import { formatNPR } from "@/lib/utils";
import { RefreshCw, TrendingUp, ShoppingCart, Package } from "lucide-react";
import type { ComponentType } from "react";

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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
      <button onClick={onRetry} className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white">
        <RefreshCw size={14} /> Retry
      </button>
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

  const fetchDashboard = useCallback(() => adminApi.dashboardStats(), []);
  const { data: stats, error: statsError, isLoading: statsLoading, isError: isStatsError, refetch: refetchStats } = useAdminData<DashboardStats>(fetchDashboard);

  const fetchSales = useCallback(() => {
    const { start, end } = getDateRange(dateRange);
    return adminApi.getSalesReport(start, end, "day");
  }, [dateRange]);

  const { data: sales, error: salesError, isLoading: salesLoading, isError: isSalesError, refetch: refetchSales } = useAdminData<SalesReport>(fetchSales);

  const revenueEntries = useMemo(() => {
    if (!sales) return [];
    return Object.entries(sales.revenueByPeriod).sort(([a], [b]) => a.localeCompare(b));
  }, [sales]);

  const maxRevenue = useMemo(() => {
    if (revenueEntries.length === 0) return 0;
    return Math.max(...revenueEntries.map(([, v]) => v.revenue));
  }, [revenueEntries]);

  const topProducts = useMemo(() => stats?.topPerformers?.products ?? [], [stats]);
  const maxSold = useMemo(() => Math.max(...topProducts.map((p) => p.totalSold), 1), [topProducts]);

  const categoryBreakdown = useMemo(() => {
    if (!stats?.topPerformers?.categories) return [];
    return Object.entries(stats.topPerformers.categories).sort(([, a], [, b]) => b - a);
  }, [stats]);

  const maxCategory = useMemo(() => Math.max(...categoryBreakdown.map(([, v]) => v), 1), [categoryBreakdown]);

  if (isStatsError && !stats) {
    return <ErrorState message={statsError || "Failed to load analytics"} onRetry={refetchStats} />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Analytics</h2>
          <p className="mt-0.5 text-sm text-brand-textMuted">Revenue, products and category performance.</p>
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
          <StatCard icon={TrendingUp} label="Revenue (30d)" value={formatNPR(stats.thisMonth.revenue)} note="Current period" />
          <StatCard icon={ShoppingCart} label="Orders (30d)" value={stats.thisMonth.orders} note="Current period" />
          <StatCard icon={Package} label="Active products" value={stats.allTime.activeProducts} note="Total catalog" />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-semibold">Revenue</h3>
          {salesLoading ? (
            <div className="mt-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-brand-bgLight" />
              ))}
            </div>
          ) : isSalesError ? (
            <ErrorState message={salesError || "Failed to load revenue data"} onRetry={refetchSales} />
          ) : revenueEntries.length > 0 ? (
            <div className="mt-4 space-y-4">
              {revenueEntries.map(([period, data]) => (
                <MiniBar
                  key={period}
                  label={period.slice(5)}
                  value={data.revenue}
                  max={maxRevenue || 1}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-brand-textMuted">No revenue data for this period.</p>
          )}
        </div>

        <div className="space-y-5">
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
                {topProducts.map((product) => (
                  <MiniBar key={product.id} label={product.name} value={product.totalSold} max={maxSold} />
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
                  <MiniBar key={category} label={category} value={count} max={maxCategory} />
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