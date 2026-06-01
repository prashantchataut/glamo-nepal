"use client";

import { useMemo } from "react";
import { PRODUCTS } from "@/lib/data/products";
import { INVENTORY_SUMMARY, LOW_STOCK_SNAPSHOT, type InventoryRisk } from "@/lib/data/inventory";
import { formatNPR } from "@/lib/utils";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { ComingSoonTooltip } from "@/components/ui/ComingSoonTooltip";
import { Boxes, AlertTriangle, Store, CheckCircle2 } from "lucide-react";
import type { ComponentType } from "react";

const riskVariantMap: Record<InventoryRisk, "success" | "warning" | "error" | "neutral"> = {
  healthy: "success",
  watch: "warning",
  low: "warning",
  out: "error",
};

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

export function InventoryView() {
  const inventoryValue = useMemo(
    () => PRODUCTS.reduce((sum, product) => sum + product.price * product.stockCount, 0),
    [],
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold">Stock control</h2>
        <p className="mt-0.5 text-sm text-brand-textMuted">Monitor stock, reorder points and estimated cover.</p>
        <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3">
          <StatCard icon={Boxes} label="Total units" value={INVENTORY_SUMMARY.totalUnits} note="Available catalog units" />
          <StatCard icon={AlertTriangle} label="Low stock" value={INVENTORY_SUMMARY.lowStockCount} note="Needs reorder review" />
          <StatCard icon={Store} label="Inventory value" value={formatNPR(inventoryValue)} note="Current retail value" />
        </div>
        <div className="mt-5 space-y-2">
          {LOW_STOCK_SNAPSHOT.map((item) => (
            <div key={item.productId} className="flex flex-col gap-2 rounded-xl border border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-brand-textMuted">{item.sku} · Reorder {item.reorderPoint} · Target {item.restockTarget}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill variant={riskVariantMap[item.risk]}>{item.risk}</StatusPill>
                <ComingSoonTooltip>
                  <button disabled className="btn-press rounded-full bg-brand-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    Restock
                  </button>
                </ComingSoonTooltip>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <h3 className="font-display text-xl font-semibold">Inventory rules</h3>
        <div className="mt-4 space-y-4 text-sm text-brand-textMuted">
          <p className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-admin-success" size={16} /> Best sellers should trigger reorder at 30 units.</p>
          <p className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-admin-success" size={16} /> Show customer-safe availability labels only.</p>
          <p className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-admin-warning" size={16} /> Connect inventory ledger before accepting real orders.</p>
        </div>
      </div>
    </section>
  );
}