"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, PackageX, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminReturnRequest, type CreateReturnRequestInput, type UpdateReturnRequestInput } from "@/lib/api/admin";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { StatusPill } from "@/components/admin/shared/StatusPill";

const PAGE_SIZE = 20;
const RETURN_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "INSPECTED", "REFUNDED", "EXCHANGED", "CLOSED"] as const;
const HYGIENE_STATUSES = ["QUARANTINE", "INSPECT", "DISPOSE", "RETURN_TO_STOCK"] as const;
const ITEM_CONDITIONS = ["SEALED", "OPENED", "DAMAGED", "LEAKED", "USED", "EXPIRED", "UNKNOWN"] as const;

type ReturnStatus = typeof RETURN_STATUSES[number];
type HygieneStatus = typeof HYGIENE_STATUSES[number];
type ItemCondition = typeof ITEM_CONDITIONS[number];

function titleCase(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string) {
  switch (status) {
    case "APPROVED":
    case "RECEIVED":
    case "INSPECTED":
      return "info" as const;
    case "REFUNDED":
    case "EXCHANGED":
    case "CLOSED":
      return "success" as const;
    case "REJECTED":
      return "error" as const;
    default:
      return "warning" as const;
  }
}

function hygieneVariant(status: string) {
  switch (status) {
    case "RETURN_TO_STOCK":
      return "success" as const;
    case "DISPOSE":
      return "error" as const;
    case "INSPECT":
      return "info" as const;
    default:
      return "warning" as const;
  }
}

function plainDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ReturnsView() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newReturn, setNewReturn] = useState<CreateReturnRequestInput>({
    orderNumber: "",
    reason: "",
    requestedResolution: "REFUND",
    itemCondition: "UNKNOWN",
    hygieneStatus: "QUARANTINE",
    customerNote: "",
  });

  const { data, meta, isLoading, isError, refetch } = useAdminData(
    () => adminApi.listReturns({ page, limit: PAGE_SIZE, status: statusFilter || undefined, search: search || undefined }),
    { deps: [page, statusFilter, search] },
  );
  const createReturn = useAdminMutation((payload: CreateReturnRequestInput) => adminApi.createReturn(payload));
  const updateReturn = useAdminMutation((vars: { id: string; data: UpdateReturnRequestInput }) => adminApi.updateReturn(vars.id, vars.data));

  const returns = useMemo(() => Array.isArray(data) ? data : [], [data]);
  const total = meta?.total ?? returns.length;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function createRequest() {
    const orderNumber = newReturn.orderNumber?.trim();
    const orderId = newReturn.orderId?.trim();
    if (!orderNumber && !orderId) {
      toast.error("Enter an order number before creating a return.");
      return;
    }
    if (!newReturn.reason?.trim()) {
      toast.error("Add a plain-language return reason.");
      return;
    }

    const result = await createReturn.mutate({
      ...newReturn,
      orderNumber: orderNumber || undefined,
      orderId: orderId || undefined,
      reason: newReturn.reason.trim(),
      customerNote: newReturn.customerNote?.trim() || undefined,
      hygieneStatus: newReturn.hygieneStatus || "QUARANTINE",
      itemCondition: newReturn.itemCondition || "UNKNOWN",
      requestedResolution: newReturn.requestedResolution || "REFUND",
    });

    if (result) {
      toast.success("Return request created and quarantined by default");
      setShowCreate(false);
      setNewReturn({ orderNumber: "", reason: "", requestedResolution: "REFUND", itemCondition: "UNKNOWN", hygieneStatus: "QUARANTINE", customerNote: "" });
      refetch();
    } else {
      toast.error(createReturn.error || "Could not create return request");
    }
  }

  async function update(id: string, data: UpdateReturnRequestInput, message: string) {
    const result = await updateReturn.mutate({ id, data });
    if (result) {
      toast.success(message);
      refetch();
    } else {
      toast.error(updateReturn.error || "Could not update return");
    }
  }

  const columns: Column<AdminReturnRequest>[] = [
    {
      key: "order",
      header: "Order",
      render: (row) => (
        <div>
          <p className="font-mono text-xs font-semibold text-brand-primary">{row.orderNumber}</p>
          <p className="mt-1 text-xs text-brand-textMuted">{row.customerName || row.customerEmail || "Customer not linked"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusPill variant={statusVariant(row.status)}>{titleCase(row.status)}</StatusPill>,
    },
    {
      key: "hygiene",
      header: "Beauty hygiene",
      render: (row) => (
        <div className="space-y-2">
          <StatusPill variant={hygieneVariant(row.hygieneStatus)}>{titleCase(row.hygieneStatus)}</StatusPill>
          <p className="text-xs text-brand-textMuted">Condition: {titleCase(row.itemCondition)}</p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (row) => (
        <div className="max-w-sm">
          <p className="text-sm font-medium">{row.reason}</p>
          {row.customerNote && <p className="mt-1 text-xs text-brand-textMuted">{row.customerNote}</p>}
        </div>
      ),
    },
    {
      key: "date",
      header: "Requested",
      render: (row) => <span className="text-sm text-brand-textMuted">{plainDate(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Next step",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === "REQUESTED" && (
            <button type="button" onClick={() => update(row.id, { status: "APPROVED", hygieneStatus: "QUARANTINE" }, "Return approved and kept in quarantine")} className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white">
              Approve
            </button>
          )}
          {row.status !== "REJECTED" && row.status !== "CLOSED" && row.status !== "REFUNDED" && (
            <button type="button" onClick={() => update(row.id, { status: "REJECTED", hygieneStatus: "DISPOSE" }, "Return rejected; item marked unsafe for resale")} className="rounded-full border border-admin-error px-3 py-1.5 text-xs font-semibold text-admin-error">
              Reject
            </button>
          )}
          {row.status === "APPROVED" && (
            <button type="button" onClick={() => update(row.id, { status: "RECEIVED", hygieneStatus: "INSPECT" }, "Return marked received for inspection")} className="rounded-full border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-primary">
              Received
            </button>
          )}
          {row.status === "RECEIVED" && row.itemCondition === "SEALED" && (
            <button type="button" onClick={() => update(row.id, { status: "INSPECTED", hygieneStatus: "RETURN_TO_STOCK" }, "Sealed item cleared for stock")} className="rounded-full border border-admin-success px-3 py-1.5 text-xs font-semibold text-admin-success">
              Restock sealed
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Returns</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Hygiene-safe return workflow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">
              Returned beauty items start in quarantine. Only sealed, inspected products should ever move back to sellable stock.
            </p>
          </div>
          <button type="button" onClick={() => setShowCreate((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm">
            <Plus size={16} /> New return
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <article className="rounded-2xl border border-brand-border bg-brand-bgLight p-4"><PackageX size={18} className="text-admin-warning" /><p className="mt-2 text-sm font-semibold">Quarantine first</p><p className="mt-1 text-xs text-brand-textMuted">No returned beauty product skips isolation.</p></article>
          <article className="rounded-2xl border border-brand-border bg-brand-bgLight p-4"><ClipboardCheck size={18} className="text-brand-primary" /><p className="mt-2 text-sm font-semibold">Inspect condition</p><p className="mt-1 text-xs text-brand-textMuted">Sealed, opened, leaked or expired must be recorded.</p></article>
          <article className="rounded-2xl border border-brand-border bg-brand-bgLight p-4"><Shield size={18} className="text-admin-info" /><p className="mt-2 text-sm font-semibold">Protect customers</p><p className="mt-1 text-xs text-brand-textMuted">Used skincare and opened cosmetics should not be resold.</p></article>
          <article className="rounded-2xl border border-brand-border bg-brand-bgLight p-4"><CheckCircle2 size={18} className="text-admin-success" /><p className="mt-2 text-sm font-semibold">Clear resolution</p><p className="mt-1 text-xs text-brand-textMuted">Refund, exchange or store credit stay traceable.</p></article>
        </div>
      </section>

      {showCreate && (
        <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <h3 className="font-display text-xl font-semibold">Create return request</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Order number
              <input value={newReturn.orderNumber ?? ""} onChange={(e) => setNewReturn((v) => ({ ...v, orderNumber: e.target.value }))} placeholder="e.g. GLAMO-2026-0012" className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium">Requested resolution
              <select value={newReturn.requestedResolution ?? "REFUND"} onChange={(e) => setNewReturn((v) => ({ ...v, requestedResolution: e.target.value as CreateReturnRequestInput["requestedResolution"] }))} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
                <option value="REFUND">Refund</option><option value="EXCHANGE">Exchange</option><option value="STORE_CREDIT">Store credit</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Item condition
              <select value={newReturn.itemCondition ?? "UNKNOWN"} onChange={(e) => setNewReturn((v) => ({ ...v, itemCondition: e.target.value as ItemCondition }))} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
                {ITEM_CONDITIONS.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Hygiene status
              <select value={newReturn.hygieneStatus ?? "QUARANTINE"} onChange={(e) => setNewReturn((v) => ({ ...v, hygieneStatus: e.target.value as HygieneStatus }))} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
                {HYGIENE_STATUSES.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
              </select>
              <span className="block text-xs text-brand-textMuted">Default is quarantine to avoid unsafe resale.</span>
            </label>
            <label className="space-y-2 text-sm font-medium md:col-span-2">Reason
              <input value={newReturn.reason} onChange={(e) => setNewReturn((v) => ({ ...v, reason: e.target.value }))} placeholder="e.g. Customer received leaked serum" className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
            </label>
            <label className="space-y-2 text-sm font-medium md:col-span-2">Customer note
              <textarea value={newReturn.customerNote ?? ""} onChange={(e) => setNewReturn((v) => ({ ...v, customerNote: e.target.value }))} rows={3} placeholder="Optional note from customer support" className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-textMuted">Cancel</button>
            <button type="button" disabled={createReturn.isLoading} onClick={createRequest} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Create return</button>
          </div>
        </section>
      )}

      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput value={search} onSearch={(q) => { setSearch(q); setPage(1); }} placeholder="Search order number, customer or reason" className="w-full md:max-w-sm" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
            <option value="">All return statuses</option>
            {RETURN_STATUSES.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
          </select>
        </div>
        {isError && <div className="mt-4 flex items-center gap-2 rounded-2xl bg-admin-error-light p-4 text-sm text-admin-error"><AlertTriangle size={16} /> Could not load returns.</div>}
        <div className="mt-4">
          <DataTable columns={columns} data={returns} keyExtractor={(row) => row.id} caption="Return requests" emptyMessage="No returns found." isLoading={isLoading} minRowWidth="980px" />
        </div>
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      </section>
    </div>
  );
}
