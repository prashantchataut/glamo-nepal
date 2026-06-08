"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, RotateCcw, ShoppingBag, Truck } from "lucide-react";
import { useCheckoutStore, type SimulatedOrder, type CustomerOrderStatus } from "@/store/useCheckoutStore";
import { ordersApi } from "@/lib/api/orders";
import { getUserMessage } from "@/lib/api/error-handler";
import { cn, formatNPR } from "@/lib/utils";
import type { Order as ApiOrder } from "@/lib/api/contracts";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-100",
  Confirmed: "bg-[#f6e6f4] text-primary ring-primary/10",
  Processing: "bg-blue-50 text-blue-700 ring-blue-100",
  Shipped: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Cancelled: "bg-red-50 text-red-700 ring-red-100",
};

const apiStatusToDisplay: Record<string, CustomerOrderStatus> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type DisplayOrder = SimulatedOrder & { source: "session" | "api" };

function apiToDisplay(order: ApiOrder): DisplayOrder {
  const address = order.shippingAddress;
  const addressStr = [address?.fullName, address?.addressLine1, address?.city, "Nepal"]
    .filter(Boolean)
    .join(", ");

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.createdAt.slice(0, 10),
    createdAt: order.createdAt,
    status: apiStatusToDisplay[order.orderStatus] || "Pending" as CustomerOrderStatus,
    items: (order.items || []).map((item) => ({
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
    source: "api",
  };
}

export function OrdersClient() {
  const [apiOrders, setApiOrders] = useState<DisplayOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionOrders = useCheckoutStore((state) => state.orders).map((order) => ({
    ...order,
    source: "session" as const,
  }));

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ordersApi.list();
      const orders = Array.isArray(response.data) ? response.data : [];
      setApiOrders(orders.map(apiToDisplay));
    } catch (err) {
      setApiOrders([]);
      setError(getUserMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const orders = [...apiOrders, ...sessionOrders].filter(
    (order, index, list) => list.findIndex((item) => item.orderNumber === order.orderNumber) === index,
  );

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Order history</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-neutral-950 md:text-5xl">
            Your GLAMO orders
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
            Track your orders, delivery progress and payment details from one place.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary"
        >
          <ShoppingBag size={16} /> Continue shopping
        </Link>
      </div>

      {!isLoading && error && orders.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-error/30 bg-error/5 p-12 text-center">
          <p className="text-sm text-error">{error}</p>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-primary"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="mt-8 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {orders.map((order) => {
            const firstItem = order.items[0];
            const detailHref = order.source !== "session" ? `/account/orders/${order.id}` : undefined;
            const card = (
              <article className="group rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:rounded-[2rem] md:p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#fffaf7] md:h-20 md:w-20">
                      {firstItem ? (
                        <Image
                          src={firstItem.image}
                          alt={firstItem.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 64px, 80px"
                        />
                      ) : (
                        <Package className="m-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-semibold text-neutral-950 md:text-2xl">
                          {order.orderNumber}
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ring-1",
                            statusStyles[order.status] || "bg-[#fffaf7] text-neutral-500 ring-neutral-200",
                          )}
                        >
                          {order.status}
                        </span>
                        {order.source === "session" ? (
                          <span className="rounded-full bg-[#f6e6f4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">
                        Placed on {order.date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        {order.paymentMethod}
                      </p>
                      <p className="mt-2 line-clamp-1 text-sm text-neutral-500">{order.shippingAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 md:block md:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">Total</p>
                    <p className="mt-1 text-xl font-bold text-neutral-950">{formatNPR(order.total)}</p>
                    {detailHref ? (
                      <span className="mt-3 hidden items-center justify-end gap-2 text-sm font-bold text-primary md:flex">
                        View details <ArrowRight size={16} />
                      </span>
                    ) : (
                      <span className="mt-3 hidden text-sm font-semibold text-neutral-400 md:block">Stored locally</span>
                    )}
                  </div>
                </div>
              </article>
            );
            return detailHref ? (
              <Link key={order.orderNumber} href={detailHref}>
                {card}
              </Link>
            ) : (
              <div key={order.orderNumber}>{card}</div>
            );
          })}

          {orders.length === 0 && (
            <div className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-12 text-center shadow-sm">
              <Package className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-4 text-lg font-semibold text-neutral-950">No orders yet</p>
              <p className="mt-1 text-sm text-neutral-500">Your order history will appear here once you make a purchase.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm md:rounded-[1.75rem]">
          <div className="flex gap-3">
            <Truck className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-neutral-950">Delivery support</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Kathmandu Valley delivery estimates, COD availability and address confirmation are surfaced during checkout.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm md:rounded-[1.75rem]">
          <div className="flex gap-3">
            <RotateCcw className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-neutral-950">Returns & help</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Delivered orders show return actions so you can request a return or exchange within the policy window.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}