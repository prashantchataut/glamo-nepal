"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { formatNpr } from "@/lib/utils";

export function CheckoutSuccessClient() {
  const order = useCheckoutStore((s) => s.lastOrder);
  return <main className="bg-brand-bgLight py-20"><div className="container mx-auto max-w-2xl px-4 text-center"><CheckCircle2 className="mx-auto mb-6 text-emerald-600" size={76}/><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Checkout success</p><h1 className="mt-3 font-serif text-5xl font-semibold text-brand-textPrimary">Thank you for your GLAMO order</h1>{order ? <div className="mx-auto mt-6 rounded-[2rem] bg-white p-6 text-left shadow-sm"><p><strong>Order:</strong> {order.orderNumber}</p><p><strong>Total:</strong> {formatNpr(order.total)}</p><p><strong>Payment:</strong> {order.paymentMethod}</p><p className="mt-3 text-sm text-brand-textMuted">We have saved your order details in this session. GLAMO will confirm delivery and payment information with you.</p></div> : <p className="mt-4 text-brand-textMuted">No order was found in this browser session.</p>}<div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/account/orders" className="rounded-full bg-brand-primary px-7 py-3 font-semibold text-white">View orders</Link><Link href="/shop" className="rounded-full border border-brand-primary px-7 py-3 font-semibold text-brand-primary">Continue shopping</Link></div></div></main>;
}
