"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { SAMPLE_ORDERS } from "@/lib/data/orders";
import { useCheckoutStore, type SimulatedOrder } from "@/store/useCheckoutStore";
import { cn, formatNPR } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-100",
  Confirmed: "bg-brand-primary-light text-brand-primary ring-brand-primary/10",
  Processing: "bg-blue-50 text-blue-700 ring-blue-100",
  Shipped: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Cancelled: "bg-red-50 text-red-700 ring-red-100",
};

type DisplayOrder = SimulatedOrder & { source: "session" | "sample" };

function sampleToDisplay(order: typeof SAMPLE_ORDERS[number]): DisplayOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.date,
    createdAt: `${order.date}T00:00:00.000Z`,
    status: order.status,
    items: order.items,
    total: order.total,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    source: "sample",
  };
}

export function OrdersClient() {
  const sessionOrders = useCheckoutStore((state) => state.orders).map((order) => ({ ...order, source: "session" as const }));
  const orders = [...sessionOrders, ...SAMPLE_ORDERS.map(sampleToDisplay)].filter((order, index, list) => list.findIndex((item) => item.orderNumber === order.orderNumber) === index);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-brand-primary">Order history</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-brand-textPrimary md:text-5xl">Your GLAMO orders</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-textMuted">Track checkout orders, sample order states and delivery/payment details from one clean customer area.</p>
        </div>
        <Link href="/shop" className="inline-flex items-center justify-center gap-2 rounded-none bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"><ShoppingBag size={16} /> Continue shopping</Link>
      </div>

      <div className="mt-8 grid gap-4">
        {orders.map((order) => {
          const firstItem = order.items[0];
          const detailHref = order.source === "sample" ? `/account/orders/${order.id}` : undefined;
          const card = (
            <article className="group rounded-none border border-brand-border bg-cream-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-none bg-brand-bgLight">
                    {firstItem ? <Image src={firstItem.image} alt={firstItem.name} fill className="object-cover" sizes="80px" /> : <Package className="m-6 text-brand-primary" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-semibold text-brand-textPrimary">{order.orderNumber}</h2>
                      <span className={cn("font-label rounded-none px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1", statusStyles[order.status] || "bg-brand-bgLight text-brand-textMuted ring-brand-border")}>{order.status}</span>
                      {order.source === "session" ? <span className="font-label rounded-none bg-brand-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-primary">New</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-brand-textMuted">Placed on {order.date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""} · {order.paymentMethod}</p>
                    <p className="mt-2 line-clamp-1 text-sm text-brand-textMuted">{order.shippingAddress}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 md:block md:text-right">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-textMuted">Total</p>
                  <p className="mt-1 text-xl font-bold text-brand-textPrimary">{formatNPR(order.total)}</p>
                  {detailHref ? <span className="mt-3 hidden items-center justify-end gap-2 text-sm font-bold text-brand-primary md:flex">View details <ArrowRight size={16} /></span> : <span className="mt-3 hidden text-sm font-semibold text-brand-textMuted md:block">Stored locally</span>}
                </div>
              </div>
            </article>
          );
          return detailHref ? <Link key={order.orderNumber} href={detailHref}>{card}</Link> : <div key={order.orderNumber}>{card}</div>;
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-brand-border bg-cream-50 p-5 shadow-sm"><div className="flex gap-3"><Truck className="mt-1 h-5 w-5 text-brand-primary" /><div><h2 className="font-display text-2xl font-semibold text-brand-textPrimary">Delivery support</h2><p className="mt-2 text-sm leading-6 text-brand-textMuted">Kathmandu Valley delivery estimates, COD availability and address confirmation are surfaced during checkout.</p></div></div></div>
        <div className="rounded-[1.75rem] border border-brand-border bg-cream-50 p-5 shadow-sm"><div className="flex gap-3"><RotateCcw className="mt-1 h-5 w-5 text-brand-primary" /><div><h2 className="font-display text-2xl font-semibold text-brand-textPrimary">Returns & help</h2><p className="mt-2 text-sm leading-6 text-brand-textMuted">Delivered sample orders show return actions; connect live order records to enable production return requests.</p></div></div></div>
      </div>
    </div>
  );
}
