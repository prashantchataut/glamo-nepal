"use client";

import { useCallback, useState } from "react";
import { formatNPR } from "@/lib/utils";

import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { adminApi, type AdminOrder } from "@/lib/api/admin";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { OrderDetailModal } from "@/components/admin/orders/OrderDetailModal";
import { toast } from "sonner";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const PAGE_SIZE = 20;

export function OrdersView() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data, error, isLoading, refetch } = useAdminData(
    useCallback(
      () => adminApi.listOrders({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      }),
      [page, statusFilter, searchQuery]
    )
  );

  const statusMutation = useAdminMutation(
    useCallback(
      (params: { id: string; status: string }) => adminApi.updateOrderStatus(params.id, params.status),
      [],
    ),
  );

  const cancelMutation = useAdminMutation(
    useCallback(
      (params: { id: string; reason?: string }) => adminApi.cancelOrder(params.id, params.reason),
      [],
    ),
  );

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      await statusMutation.mutate({ id: orderId, status: newStatus });
      refetch();
    },
    [statusMutation, refetch],
  );

  const handleCancelOrder = useCallback(async () => {
    if (!cancelOrderId) return;
    try {
      await cancelMutation.mutate({ id: cancelOrderId, reason: cancelReason || undefined });
      toast.success("Order cancelled");
      setCancelOrderId(null);
      setCancelReason("");
      refetch();
    } catch {
      toast.error("Failed to cancel order");
    }
  }, [cancelOrderId, cancelReason, cancelMutation, refetch]);

  const columns: Column<AdminOrder>[] = [
    {
      key: "order_number",
      header: "Order",
      render: (order) => (
        <button
          onClick={() => setDetailOrderId(order.id)}
          className="font-mono text-xs font-semibold text-brand-primary hover:underline"
        >
          {order.order_number}
        </button>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (order) => <span>{new Date(order.created_at).toLocaleDateString()}</span>,
    },
    {
      key: "items",
      header: "Items",
      render: (order) => <span>{order.items?.length ?? 0}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      render: (order) => <span>{order.payment_method ?? "N/A"}</span>,
    },
    {
      key: "address",
      header: "Address",
      render: (order) => <span className="max-w-[200px] truncate block">{order.shipping_address}</span>,
    },
    {
      key: "total",
      header: "Total",
      render: (order) => <span className="font-semibold">{formatNPR(order.total_amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (order) => (
        <div className="flex items-center gap-2">
          <select
            aria-label="Order status"
            value={order.status}
            onChange={(e) => handleStatusChange(order.id, e.target.value)}
            disabled={statusMutation.isLoading}
            className="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {order.status !== "CANCELLED" && (
            <button
              onClick={() => setCancelOrderId(order.id)}
              className="text-xs font-medium text-admin-error hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Orders</h2>
          <p className="mt-1 text-sm text-brand-textMuted">
            Update statuses for COD, Khalti, eSewa and card orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <SearchInput
          value={searchQuery}
          onSearch={(q) => { setSearchQuery(q); setPage(1); }}
          placeholder="Search by order number or customer"
        />
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={orders}
          keyExtractor={(o) => o.id}
          caption="Order management"
          isLoading={isLoading}
          emptyMessage={error ? `Error: ${error}` : "No orders found."}
          minRowWidth="900px"
          onRowClick={(o) => setDetailOrderId(o.id)}
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      <OrderDetailModal
        open={detailOrderId !== null}
        onOpenChange={(open) => { if (!open) setDetailOrderId(null); }}
        orderId={detailOrderId}
      />

      <ConfirmDialog
        open={cancelOrderId !== null}
        onOpenChange={(open) => { if (!open) { setCancelOrderId(null); setCancelReason(""); } }}
        title="Cancel order"
        description="This will mark the order as cancelled. This action cannot be undone."
        confirmLabel="Cancel order"
        variant="destructive"
        isLoading={cancelMutation.isLoading}
        onConfirm={handleCancelOrder}
      >
        <label className="mt-2 block space-y-2 text-sm font-medium">
          Reason (optional)
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation"
            className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </label>
      </ConfirmDialog>
    </section>
  );
}