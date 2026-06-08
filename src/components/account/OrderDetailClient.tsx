"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Download, Package, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { ordersApi } from "@/lib/api/orders";
import { useCheckoutStore, type SimulatedOrder, type CustomerOrderStatus } from "@/store/useCheckoutStore";
import type { Order as ApiOrder } from "@/lib/api/contracts";
import { cn, formatNPR } from "@/lib/utils";

const steps = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"] as const;
const stepIcons = [Clock3, CheckCircle2, PackageCheck, Truck, CheckCircle2];

const apiStatusToDisplay: Record<string, CustomerOrderStatus> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function apiToDisplay(order: ApiOrder): SimulatedOrder {
  const address = order.shippingAddress;
  const addressStr = [address?.fullName, address?.addressLine1, address?.city, "Nepal"].filter(Boolean).join(", ");
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.slice(0, 10),
    createdAt: order.createdAt,
    status: apiStatusToDisplay[order.orderStatus] || "Pending",
    items: order.items.map((item) => ({
      name: item.name,
      brand: "",
      image: "/images/products/placeholder.svg",
      price: item.unitPrice,
      quantity: item.quantity,
      selectedShade: item.selectedShade,
    })),
    total: order.grandTotal,
    shippingAddress: addressStr,
    paymentMethod: order.paymentMethod,
  };
}

export function OrderDetailClient() {
  const params = useParams<{ id: string }>();
  const sessionOrder = useCheckoutStore((state) => state.orders).find((o) => o.id === params.id);

  const [order, setOrder] = useState<SimulatedOrder | null>(sessionOrder ?? null);
  const [isLoading, setIsLoading] = useState(!sessionOrder);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    if (sessionOrder) {
      setOrder(sessionOrder);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    ordersApi
      .get(params.id)
      .then((response) => {
        if (cancelled) return;
        setOrder(apiToDisplay(response.data));
      })
      .catch(() => {
        if (cancelled) return;
        setNotFoundError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, sessionOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFoundError || !order) {
    return (
      <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-8 text-center shadow-sm md:rounded-[2rem] md:p-12">
        <Package className="mx-auto h-12 w-12 text-neutral-300" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-neutral-950">Order not found</h2>
        <p className="mt-2 text-sm text-neutral-500">This order may not exist or you may not have access.</p>
        <Link
          href="/account/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-primary"
        >
          <ArrowLeft size={14} /> Back to orders
        </Link>
      </div>
    );
  }

  const activeIndex = Math.max(0, steps.indexOf(order.status as typeof steps[number]));
  const isCancelled = order.status === "Cancelled";

return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-primary">
        <ArrowLeft size={16} /> Back to orders
      </Link>
      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Order detail</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-neutral-950 md:text-5xl">{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-neutral-500">Placed on {order.date} · Paid by {order.paymentMethod}</p>
        </div>
        <span className={cn("w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]", isCancelled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>{order.status}</span>
      </div>

      {!isCancelled ? (
        <section className="mt-8 rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
          <h2 className="font-display text-2xl font-semibold text-neutral-950">Tracking timeline</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = stepIcons[index];
              const completed = index < activeIndex;
              const current = index === activeIndex;
              return (
                <div key={step} className="relative rounded-[1rem] bg-[#fffaf7] p-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold", completed ? "bg-emerald-600 text-white" : current ? "bg-primary text-white" : "bg-white text-neutral-400")}><Icon size={18} /></div>
                  <p className={cn("mt-3 text-sm font-semibold", completed ? "text-emerald-700" : current ? "text-primary" : "text-neutral-400")}>{step}</p>
                  <p className="mt-1 text-xs text-neutral-500">{completed || current ? order.date : "Pending update"}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
          <h2 className="font-display text-2xl font-semibold text-neutral-950">Items</h2>
          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="flex items-center gap-4 rounded-[1.25rem] bg-[#fffaf7] p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-neutral-950">{item.name}</p>
                  <p className="text-xs text-neutral-500">{[item.brand, item.selectedShade, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="font-bold text-neutral-950">{formatNPR(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">Delivery & payment</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-500">
              <p><span className="font-semibold text-neutral-950">Address:</span> {order.shippingAddress}</p>
              <p><span className="font-semibold text-neutral-950">Payment:</span> {order.paymentMethod}</p>
            </div>
          </section>
          <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-6">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="text-neutral-950">{formatNPR(order.total)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span className="text-emerald-600">Free</span></div>
              <div className="flex justify-between border-t border-neutral-200 pt-3 font-semibold"><span className="text-neutral-950">Total</span><span className="text-lg text-neutral-950">{formatNPR(order.total)}</span></div>
            </div>
          </section>
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button disabled aria-disabled="true" title="Coming soon" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition cursor-not-allowed opacity-50"><Download size={16} /> Invoice</button>
            {order.status === "Delivered" ? <button disabled aria-disabled="true" title="Coming soon" className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-500 transition cursor-not-allowed opacity-50"><RotateCcw size={16} /> Return request</button> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
