"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { formatNPR } from "@/lib/utils";
import {
  StatusPill,
  stockStatusToVariant,
} from "@/components/admin/shared/StatusPill";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { RestockModal } from "@/components/admin/inventory/RestockModal";
import { Boxes, AlertTriangle, Store, RefreshCw } from "lucide-react";
import type { ComponentType } from "react";

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
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">
        {value}
      </p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}

function getStockStatus(quantity: number, threshold: number): string {
  if (quantity <= 0) return "out of stock";
  if (quantity <= threshold) return "low stock";
  if (quantity <= threshold * 1.5) return "watch";
  return "healthy";
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle size={32} className="text-admin-error" />
      <p className="mt-3 text-sm text-brand-textMuted">{message}</p>
      <button
        onClick={onRetry}
        className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

const PAGE_SIZE = 20;

interface InventoryRow {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  category: { name: string } | null;
  // Price fields - used to calculate the real retail value of stock on hand.
  // Backend may return either snake_case (DB direct) or camelCase (DTO).
  base_price?: number;
  basePrice?: number;
  sale_price?: number | null;
  salePrice?: number | null;
  cost_price?: number;
  costPrice?: number;
}

export function InventoryView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [restockTarget, setRestockTarget] = useState<{
    id: string;
    name: string;
    stock: number;
  } | null>(null);

  const {
    data: stockReport,
    meta: stockMeta,
    isLoading: isStockLoading,
    isError: isStockError,
    refetch: refetchStock,
  } = useAdminData(
    () =>
      adminApi.getStockReport({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      }),
    { deps: [page, search] },
  );
  const { data: lowStockData, refetch: refetchLowStock } = useAdminData(() =>
    adminApi.getLowStockAlerts(),
  );

  const products: InventoryRow[] = useMemo(() => {
    if (!stockReport) return [];
    if (Array.isArray(stockReport))
      return stockReport as unknown as InventoryRow[];
    return ((stockReport as unknown as Record<string, unknown>).products ??
      []) as unknown as InventoryRow[];
  }, [stockReport]);

  const total =
    stockMeta?.total ??
    (Array.isArray(stockReport)
      ? stockReport.length
      : ((stockReport
          ? ((stockReport as unknown as Record<string, unknown>)
              .total as number)
          : 0) ?? 0));

  const lowStockAlerts = useMemo(() => {
    if (!lowStockData) return [];
    if (Array.isArray(lowStockData)) return lowStockData;
    if ("products" in lowStockData && Array.isArray(lowStockData.products))
      return lowStockData.products;
    return [];
  }, [lowStockData]);

  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0),
    [products],
  );
  // FIX: Previously this just summed stock_quantity (number of units), which
  // produced nonsense like "740 units, ₹740 value". Now we multiply each
  // product's effective unit price (sale price if on sale, otherwise base
  // price) by its stock quantity to get the real retail value of inventory.
  const inventoryValue = useMemo(
    () =>
      products.reduce((sum, p) => {
        const basePrice = Number(p.base_price ?? p.basePrice ?? 0);
        const salePrice = Number(p.sale_price ?? p.salePrice ?? 0);
        const effectivePrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
        return sum + effectivePrice * (Number(p.stock_quantity) || 0);
      }, 0),
    [products],
  );
  const lowStockCount = lowStockAlerts.length;

  const columns: Column<InventoryRow>[] = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div>
          <p className="font-semibold text-brand-textPrimary">{row.name}</p>
          <p className="text-xs text-brand-textMuted">{row.sku || "-"}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="text-sm">{row.category?.name || "-"}</span>
      ),
    },
    {
      key: "stock_quantity",
      header: "Stock",
      render: (row) => (
        <span className="font-medium">{row.stock_quantity}</span>
      ),
    },
    {
      key: "low_stock_threshold",
      header: "Reorder Point",
      render: (row) => (
        <span className="text-sm">{row.low_stock_threshold}</span>
      ),
    },
    {
      key: "risk",
      header: "Risk Level",
      render: (row) => {
        const status = getStockStatus(
          row.stock_quantity,
          row.low_stock_threshold,
        );
        return (
          <StatusPill variant={stockStatusToVariant(status)}>
            {status}
          </StatusPill>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={() =>
            setRestockTarget({
              id: row.id,
              name: row.name,
              stock: row.stock_quantity,
            })
          }
          className="btn-press rounded-full bg-brand-primary px-4 py-2 text-xs font-medium text-white"
        >
          Restock
        </button>
      ),
    },
  ];

  if (isStockError) {
    return (
      <ErrorState
        message="Failed to load inventory data"
        onRetry={refetchStock}
      />
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Stock control
            </h2>
            <p className="mt-0.5 text-sm text-brand-textMuted">
              Monitor stock, reorder points and estimated cover.
            </p>
          </div>
        </div>

        {isStockLoading ? (
          <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[2rem] border border-brand-border bg-white p-6"
              >
                <div className="h-4 w-16 animate-pulse rounded bg-brand-border/50" />
                <div className="mt-4 h-8 w-24 animate-pulse rounded bg-brand-border/50" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-brand-border/50" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3">
            <StatCard
              icon={Boxes}
              label="Total units"
              value={totalUnits}
              note="Available catalog units"
            />
            <StatCard
              icon={AlertTriangle}
              label="Low stock"
              value={lowStockCount}
              note="Needs reorder review"
            />
            <StatCard
              icon={Store}
              label="Inventory value"
              value={formatNPR(inventoryValue)}
              note="Current retail value"
            />
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <SearchInput
            onSearch={setSearch}
            placeholder="Search products-"
            className="max-w-xs"
          />
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(row) => row.id}
            caption="Stock report"
            isLoading={isStockLoading}
            emptyMessage="No products found."
          />
        </div>

        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <Pagination
            page={page}
            totalPages={stockMeta?.totalPages ?? Math.ceil(total / PAGE_SIZE)}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>

      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <h3 className="font-display text-xl font-semibold">Low stock alerts</h3>
        {lowStockData === undefined ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-brand-bgLight"
              />
            ))}
          </div>
        ) : lowStockData === null || isStockError ? (
          <ErrorState
            message="Failed to load alerts"
            onRetry={refetchLowStock}
          />
        ) : lowStockAlerts.length > 0 ? (
          <div className="mt-4 space-y-2">
            {lowStockAlerts.map(
              (item: {
                id: string;
                name: string;
                sku?: string | null;
                stock_quantity: number;
                low_stock_threshold: number;
              }) => {
                const status = getStockStatus(
                  item.stock_quantity,
                  item.low_stock_threshold,
                );
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-brand-textMuted">
                        {item.sku} - Reorder at {item.low_stock_threshold}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill variant={stockStatusToVariant(status)}>
                        {status}
                      </StatusPill>
                      <button
                        onClick={() =>
                          setRestockTarget({
                            id: item.id,
                            name: item.name,
                            stock: item.stock_quantity,
                          })
                        }
                        className="btn-press rounded-full bg-brand-primary px-4 py-2 text-xs font-medium text-white"
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <EmptyState
            icon={Boxes}
            title="All stock healthy"
            description="No low stock alerts right now."
          />
        )}
      </div>

      {restockTarget && (
        <RestockModal
          open={!!restockTarget}
          onOpenChange={(open) => {
            if (!open) setRestockTarget(null);
          }}
          productId={restockTarget.id}
          productName={restockTarget.name}
          currentStock={restockTarget.stock}
          onRestocked={() => {
            refetchStock();
            refetchLowStock();
          }}
        />
      )}
    </section>
  );
}
