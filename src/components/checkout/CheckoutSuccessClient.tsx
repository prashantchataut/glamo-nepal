"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Copy, PackageCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { formatNPR } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";

export function CheckoutSuccessClient() {
  const order = useCheckoutStore((state) => state.lastOrder);

  async function copyOrderNumber() {
    if (!order?.orderNumber) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      toast.success("Order number copied");
    } catch {
      toast.error("Could not copy — please select and copy manually");
    }
  }

  if (!order) {
    return (
      <main className="bg-[#fffaf7] px-4 py-12 pb-24 md:px-6 md:py-16 md:pb-16">
        <div className="mx-auto max-w-lg text-center" aria-live="polite">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f6e6f4] text-primary">
            <ShoppingBag size={30} />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-5xl">
            No recent order
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-500">
            No recent order found in this browser session.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-primary"
          >
            Start shopping
          </Link>
        </div>
      </main>
    );
  }

  const orderSchema = {
    "@context": "https://schema.org",
    "@type": "Order",
    orderNumber: order.orderNumber,
    orderStatus: "https://schema.org/OrderProcessing",
    orderDate: order.createdAt,
    acceptedOffer: order.items.slice(0, 3).map((item) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Product",
        name: item.name,
        image: item.image,
        brand: { "@type": "Brand", name: item.brand },
      },
      price: item.price * item.quantity,
      priceCurrency: "NPR",
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        value: item.quantity,
      },
    })),
    totalPrice: order.total,
    priceCurrency: "NPR",
    paymentMethod: order.paymentMethod,
  };

  return (
    <main className="bg-[#fffaf7] px-4 py-8 pb-24 md:px-6 md:py-12 md:pb-16">
      <JsonLd data={orderSchema} />
      <div className="mx-auto max-w-2xl">
        {/* Success header */}
        <div className="rounded-[2rem] bg-[#f6e6f4] px-5 py-6 md:rounded-[2.5rem] md:px-8 md:py-8" role="status" aria-live="polite">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white md:h-16 md:w-16">
              <CheckCircle2 size={28} />
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Order Confirmed
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-5xl">
              Thank You for Your Order
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-600">
              Your order has been placed successfully. GLAMO will confirm delivery and payment details with you shortly.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-neutral-200 bg-white shadow-[0_18px_70px_-56px_rgba(26,21,18,0.55)] md:mt-8 md:rounded-[2rem]">
          {/* Order number */}
          <div className="flex items-start justify-between gap-4 p-4 md:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Order Number
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-neutral-950 md:text-3xl">
                {order.orderNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={copyOrderNumber}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-all hover:bg-neutral-50 hover:text-primary active:scale-95"
              aria-label="Copy order number"
            >
              <Copy size={16} />
            </button>
          </div>

          {/* Order details */}
          <div className="border-t border-neutral-200 p-4 md:p-6">
            <div className="space-y-2 text-sm text-neutral-600">
              <p><span className="font-semibold text-neutral-950">Total:</span> {formatNPR(order.total)}</p>
              <p><span className="font-semibold text-neutral-950">Payment:</span> {order.paymentMethod}</p>
              <p><span className="font-semibold text-neutral-950">Delivery:</span> {order.shippingAddress}</p>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-neutral-200 p-4 md:p-6">
            <div className="flex items-center gap-2 text-primary">
              <PackageCheck size={16} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Items</p>
            </div>
            <div className="mt-3 space-y-2.5">
              {order.items.slice(0, 3).map((item) => (
                <div key={`${item.name}-${item.quantity}-${item.selectedShade || "base"}`} className="flex items-center gap-3 rounded-[1rem] bg-[#fffaf7] p-2.5 md:p-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-[0.75rem] bg-neutral-100 md:h-16 md:w-14">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 48px, 56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-950">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      {formatNPR(item.price)} each &middot; Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-950">{formatNPR(item.price * item.quantity)}</p>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-center text-sm text-neutral-500">+ {order.items.length - 3} more items</p>
              )}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center md:mt-8">
          <Link
            href="/account/orders"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-200 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:border-neutral-400"
          >
            View Orders
          </Link>
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-primary"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}