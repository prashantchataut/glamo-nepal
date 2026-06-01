"use client";

import { useState } from "react";
import { SAMPLE_ORDER_HISTORY, type Order } from "@/lib/data/orders";
import { formatNPR } from "@/lib/utils";
import { ComingSoonTooltip } from "@/components/ui/ComingSoonTooltip";

export function OrdersView() {
  const [orderStatusById, setOrderStatusById] = useState<Record<string, Order["status"]>>({});

  const orderRows = SAMPLE_ORDER_HISTORY.map((order) => ({
    ...order,
    status: orderStatusById[order.id] || order.status,
  }));

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
          <ComingSoonTooltip>
            <button disabled className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Today
            </button>
          </ComingSoonTooltip>
          <ComingSoonTooltip>
            <button disabled className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              This week
            </button>
          </ComingSoonTooltip>
          <ComingSoonTooltip>
            <button disabled className="btn-press rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">
              Create manual order
            </button>
          </ComingSoonTooltip>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto -mx-6 px-6">
        <table className="w-full min-w-[900px] text-sm">
          <caption className="sr-only">Order management</caption>
          <thead>
            <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
              <th scope="col" className="px-4 py-3">Order</th>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3">Items</th>
              <th scope="col" className="px-4 py-3">Payment</th>
              <th scope="col" className="px-4 py-3">Address</th>
              <th scope="col" className="px-4 py-3">Total</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.map((order) => (
              <tr key={order.id} className="border-b border-brand-border/70 last:border-0">
                <td className="px-4 py-4 font-mono text-xs font-semibold">{order.orderNumber}</td>
                <td className="px-4 py-4">{order.date}</td>
                <td className="px-4 py-4">{order.items.length}</td>
                <td className="px-4 py-4">{order.paymentMethod}</td>
                <td className="px-4 py-4 max-w-[200px] truncate">{order.shippingAddress}</td>
                <td className="px-4 py-4 font-semibold">{formatNPR(order.total)}</td>
                <td className="px-4 py-4">
                  <select
                    aria-label="Order status"
                    value={order.status}
                    onChange={(event) =>
                      setOrderStatusById((current) => ({
                        ...current,
                        [order.id]: event.target.value as Order["status"],
                      }))
                    }
                    className="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                  >
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}