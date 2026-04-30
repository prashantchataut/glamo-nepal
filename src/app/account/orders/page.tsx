import Link from "next/link";
import Image from "next/image";
import { MOCK_ORDERS } from "@/lib/mock/orders";
import { createMetadata } from "@/lib/seo";
import { formatNpr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export const metadata = createMetadata({
  title: "My Orders",
  description: "View your GLAMO NEPAL order history and track deliveries.",
  path: "/account/orders",
  noIndex: true,
});

export default function OrdersPage() {
  const orders = MOCK_ORDERS;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary md:text-4xl">My Orders</h1>
      <p className="mt-2 text-sm text-brand-textMuted">Track and review your GLAMO NEPAL orders.</p>

      {orders.length === 0 ? (
        <div className="mt-12 text-center">
          <Package className="mx-auto h-16 w-16 text-brand-textMuted/30" />
          <p className="mt-4 text-lg font-semibold text-brand-textPrimary">No orders yet</p>
          <p className="mt-1 text-sm text-brand-textMuted">Your order history will appear here once you place an order.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-bgDark"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="group block rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-serif text-lg font-semibold text-brand-textPrimary transition group-hover:text-brand-primary">
                      {order.orderNumber}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider",
                        order.status === "Delivered"
                          ? "bg-emerald-50 text-emerald-700"
                          : order.status === "Cancelled"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-brand-textMuted">
                    Placed on {order.date} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold text-brand-gold">{formatNpr(order.total)}</p>
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div
                        key={`${order.id}-${item.name}-${i}`}
                        className="relative h-10 w-10 overflow-hidden rounded-xl border-2 border-white bg-brand-bgLight"
                      >
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-brand-bgLight text-xs font-semibold text-brand-textMuted">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}