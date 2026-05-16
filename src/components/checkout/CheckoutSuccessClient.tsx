"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Copy, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { formatNPR } from "@/lib/utils";

export function CheckoutSuccessClient() {
  const order = useCheckoutStore((state) => state.lastOrder);

  function copyOrderNumber() {
    if (!order?.orderNumber) return;
    navigator.clipboard?.writeText(order.orderNumber);
    toast.success("Order number copied");
  }

  return (
    <main className="bg-cream-50 py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        {/* Success header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-brand-rose text-white">
            <CheckCircle2 size={32} />
          </div>
          <p className="type-label text-[11px] text-gold mt-4">Order Confirmed</p>
          <h1 className="type-display-lg text-ink mt-2">Thank You for Your Order</h1>
          <p className="type-body-md text-cream-400 mt-3 max-w-md mx-auto">
            Your order has been placed successfully. GLAMO will confirm delivery and payment details with you shortly.
          </p>
        </div>

        {order ? (
          <div className="mt-10 border border-cream-200">
            {/* Order number */}
            <div className="p-6 flex items-start justify-between gap-4">
              <div>
                <p className="type-label text-[11px] text-cream-400">Order Number</p>
                <p className="type-display-md text-ink mt-1">{order.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={copyOrderNumber}
                className="flex h-10 w-10 items-center justify-center border border-cream-200 text-cream-700 transition-colors hover:text-brand-rose cursor-pointer"
                aria-label="Copy order number"
              >
                <Copy size={16} />
              </button>
            </div>

            {/* Order details */}
            <div className="border-t border-cream-200 p-6 type-body-sm text-cream-400 space-y-2">
              <p><span className="text-ink font-medium">Total:</span> {formatNPR(order.total)}</p>
              <p><span className="text-ink font-medium">Payment:</span> {order.paymentMethod}</p>
              <p><span className="text-ink font-medium">Delivery:</span> {order.shippingAddress}</p>
            </div>

            {/* Items */}
            <div className="border-t border-cream-200 p-6">
              <div className="flex items-center gap-2 text-brand-rose mb-4">
                <PackageCheck size={16} />
                <p className="type-label text-[11px]">Items</p>
              </div>
              <div className="space-y-3">
                {order.items.slice(0, 3).map((item) => (
                  <div key={`${item.name}-${item.quantity}-${item.selectedShade || "base"}`} className="flex items-center gap-3 bg-cream-50 p-3">
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-cream-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                      <p className="type-body-sm text-cream-400">Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="type-body-sm text-cream-400 text-center">+ {order.items.length - 3} more items</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 border border-cream-200 p-8 text-center">
            <p className="type-body-md text-cream-400">No recent order found in this browser session.</p>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/account/orders"
            className="bg-brand-rose px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-brand-rose-dark cursor-pointer"
          >
            View Orders
          </Link>
          <Link
            href="/shop"
            className="border border-cream-200 px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-cream-700 transition-colors hover:border-cream-400 cursor-pointer"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}