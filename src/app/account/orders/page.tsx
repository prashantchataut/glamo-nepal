import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { SAMPLE_ORDERS as SAMPLE_ORDERS } from "@/lib/data/orders";
import { createMetadata } from "@/lib/seo";
import { cn, formatNpr } from "@/lib/utils";

export const metadata = createMetadata({
  title: "My Orders",
  description: "Track GLAMO NEPAL order history and delivery status.",
  path: "/account/orders",
  noIndex: true,
});

const statusTone: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-100",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-100",
  Processing: "bg-purple-50 text-purple-700 ring-purple-100",
  Shipped: "bg-sky-50 text-sky-700 ring-sky-100",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Cancelled: "bg-red-50 text-red-700 ring-red-100",
};

export default function OrdersPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Orders</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">My orders</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-textMuted">Track your GLAMO orders, delivery updates, invoices and returns.</p>
        </div>
        <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">Need help? <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-8 space-y-4">
        {SAMPLE_ORDERS.map((order) => (
          <article key={order.id} className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary"><PackageSearch size={20} /></div>
                <div>
                  <Link href={`/account/orders/${order.id}`} className="font-serif text-2xl font-semibold text-brand-textPrimary hover:text-brand-primary">{order.orderNumber}</Link>
                  <p className="mt-1 text-sm text-brand-textMuted">{order.date} · {order.paymentMethod} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ring-1", statusTone[order.status])}>{order.status}</span>
                <p className="font-bold text-brand-gold">{formatNpr(order.total)}</p>
                <Link href={`/account/orders/${order.id}`} className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-bgDark">View details</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
