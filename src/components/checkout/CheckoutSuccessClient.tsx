"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Copy, PackageCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { formatNpr } from "@/lib/utils";

export function CheckoutSuccessClient() {
  const order = useCheckoutStore((state) => state.lastOrder);

  function copyOrderNumber() {
    if (!order?.orderNumber) return;
    navigator.clipboard?.writeText(order.orderNumber);
    toast.success("Order number copied");
  }

  return (
    <main className="bg-brand-bgLight py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="overflow-hidden rounded-[2.25rem] border border-brand-border bg-white shadow-[0_28px_90px_-65px_rgba(36,31,34,0.45)]">
          <div className="bg-[linear-gradient(135deg,#FFFDFC_0%,#F8EEF2_52%,#F7F1EA_100%)] p-8 text-center md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-brand-border">
              <CheckCircle2 size={46} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Checkout success</p>
            <h1 className="mx-auto mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-6xl">Thank you for your GLAMO order</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-brand-textMuted md:text-base">Your order has been recorded in this browser session. GLAMO can now confirm delivery, stock and payment details with the customer.</p>
          </div>

          {order ? (
            <div className="grid gap-6 p-5 md:grid-cols-[1fr_0.8fr] md:p-8">
              <section className="rounded-[1.75rem] border border-brand-border bg-brand-bgLight p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Order number</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{order.orderNumber}</h2>
                  </div>
                  <button type="button" onClick={copyOrderNumber} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-primary shadow-sm ring-1 ring-brand-border" aria-label="Copy order number">
                    <Copy size={17} />
                  </button>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-brand-textMuted">
                  <p><span className="font-semibold text-brand-textPrimary">Total:</span> {formatNpr(order.total)}</p>
                  <p><span className="font-semibold text-brand-textPrimary">Payment:</span> {order.paymentMethod}</p>
                  <p><span className="font-semibold text-brand-textPrimary">Delivery:</span> {order.shippingAddress}</p>
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-brand-border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-brand-primary"><PackageCheck size={18} /><p className="text-xs font-bold uppercase tracking-[0.18em]">Items</p></div>
                <div className="mt-4 space-y-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={`${item.name}-${item.quantity}-${item.selectedShade || "base"}`} className="flex items-center gap-3 rounded-2xl bg-brand-bgLight p-3">
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-white"><Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" /></div>
                      <div className="min-w-0 flex-1"><p className="line-clamp-1 text-sm font-semibold text-brand-textPrimary">{item.name}</p><p className="text-xs text-brand-textMuted">Qty {item.quantity}</p></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-brand-textMuted">No recent order was found in this browser session.</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 border-t border-brand-border bg-[#FFFDFC] p-6">
            <Link href="/account/orders" className="rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-primary-hover">View orders</Link>
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 px-7 py-3 font-semibold text-brand-primary transition hover:bg-brand-primary-light"><ShoppingBag size={17} /> Continue shopping</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
