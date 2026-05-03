"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import { SAMPLE_ORDERS } from "@/lib/data/orders";
import { useCheckoutStore, type SimulatedOrder } from "@/store/useCheckoutStore";
import { cn, formatNpr } from "@/lib/utils";

const steps = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

type DisplayOrder = SimulatedOrder & { source: "session" | "sample" };

function sampleToDisplay(order: (typeof SAMPLE_ORDERS)[number]): DisplayOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.date,
    createdAt: `${order.date}T00:00:00.000Z`,
    status: order.status,
    items: order.items.map((item) => ({ ...item, selectedShade: undefined })),
    total: order.total,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    source: "sample",
  };
}

export function OrderDetailClient() {
  const params = useParams<{ id: string }>();
  const sessionOrders = useCheckoutStore((state) => state.orders);

  const allOrders: DisplayOrder[] = [
    ...sessionOrders.map((o) => ({ ...o, source: "session" as const })),
    ...SAMPLE_ORDERS.map(sampleToDisplay),
  ];

  const order = allOrders.find((o) => o.id === params.id);
  if (!order) notFound();

  const activeIndex = Math.max(0, steps.indexOf(order.status));
  const isCancelled = order.status === "Cancelled";

  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-textMuted transition hover:text-brand-primary">
        <ArrowLeft size={16} /> Back to orders
      </Link>
      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Order detail</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-brand-textMuted">Placed on {order.date} · Paid by {order.paymentMethod}</p>
        </div>
        <span className={cn("w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]", isCancelled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>{order.status}</span>
      </div>

      {!isCancelled ? (
        <section className="mt-8 rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Tracking timeline</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step} className="relative rounded-2xl bg-brand-bgLight p-4">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold", index <= activeIndex ? "bg-brand-primary text-white" : "bg-white text-brand-textMuted")}>{index + 1}</div>
                <p className={cn("mt-3 text-sm font-semibold", index <= activeIndex ? "text-brand-primary" : "text-brand-textMuted")}>{step}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
          <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Items</h2>
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="flex items-center gap-4 rounded-2xl bg-brand-bgLight p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brand-textPrimary">{item.name}</p>
                  <p className="text-xs text-brand-textMuted">{item.brand} · Qty {item.quantity}</p>
                </div>
                <p className="font-bold text-brand-gold">{formatNpr(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Delivery & payment</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-brand-textMuted">
              <p><span className="font-semibold text-brand-textPrimary">Address:</span> {order.shippingAddress}</p>
              <p><span className="font-semibold text-brand-textPrimary">Payment:</span> {order.paymentMethod}</p>
            </div>
          </section>
          <section className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-brand-textMuted">Subtotal</span><span>{formatNpr(order.total)}</span></div>
              <div className="flex justify-between"><span className="text-brand-textMuted">Delivery</span><span className="text-emerald-600">Free</span></div>
              <div className="flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span className="text-lg text-brand-gold">{formatNpr(order.total)}</span></div>
            </div>
          </section>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary px-5 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"><Download size={16} /> Invoice</button>
            {order.status === "Delivered" ? <button className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-semibold text-brand-textMuted transition hover:border-brand-primary hover:text-brand-primary"><RotateCcw size={16} /> Return request</button> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}