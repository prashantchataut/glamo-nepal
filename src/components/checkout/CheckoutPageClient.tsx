"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Gift, LockKeyhole, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";
import { createCheckoutOrder } from "@/lib/api/checkout";
import type { PaymentMethodCode } from "@/lib/api/contracts";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { calculateDeliveryFee, getDeliveryRule, getDistrictsForProvince, getFreeDeliveryProgress, PROVINCES } from "@/lib/delivery";
import { formatNpr } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const paymentMethods = ["Cash on Delivery", "Khalti", "eSewa", "Cards"];

const paymentCodeMap: Record<string, PaymentMethodCode> = {
  "Cash on Delivery": "cod",
  Khalti: "khalti",
  eSewa: "esewa",
  Cards: "card",
};
const checkoutSteps = ["Contact", "Delivery", "Payment", "Review"];

interface CheckoutFormState {
  name: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  ward: string;
  address: string;
  giftWrap: boolean;
  notes: string;
  payment: string;
}

const initialForm: CheckoutFormState = {
  name: "",
  email: "",
  phone: "",
  province: "Bagmati",
  district: "Kathmandu",
  city: "Kathmandu",
  ward: "",
  address: "",
  giftWrap: false,
  notes: "",
  payment: "Cash on Delivery",
};

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { status, placeOrder } = useCheckoutStore();
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const subtotal = getSubtotal();
  const deliveryRule = getDeliveryRule(form.district, form.province);
  const deliveryFee = calculateDeliveryFee(subtotal, form.district, form.province);
  const freeDelivery = getFreeDeliveryProgress(subtotal, form.district, form.province);
  const giftWrapFee = form.giftWrap ? 100 : 0;
  const total = subtotal + deliveryFee + giftWrapFee;
  const phoneValid = /^(\+977\s?)?9[78]\d{8}$/.test(form.phone.trim());
  const districtOptions = useMemo(() => getDistrictsForProvince(form.province), [form.province]);
  const canSubmit = Boolean(
    items.length > 0 &&
      form.name.trim() &&
      phoneValid &&
      form.district &&
      form.city.trim() &&
      form.ward.trim() &&
      form.address.trim() &&
      (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable),
  );

  useEffect(() => {
    if (items.length) trackEvent("checkout_started", { value: subtotal });
  }, [items.length, subtotal]);

  const completedSteps = [
    Boolean(form.name.trim() && phoneValid),
    Boolean(form.province && form.district && form.city.trim() && form.ward.trim() && form.address.trim()),
    Boolean(form.payment && (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable)),
    canSubmit,
  ];

  function updateForm(next: Partial<CheckoutFormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function updateProvince(province: string) {
    const districts = getDistrictsForProvince(province);
    setForm((current) => ({
      ...current,
      province,
      district: districts[0] || "Other",
      city: province === "Bagmati" ? "Kathmandu" : "",
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Please complete required checkout details");
      return;
    }
    let orderNumber = `GLM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingAddress = `${form.address}, Ward ${form.ward}, ${form.city}, ${form.district}, ${form.province}, Nepal`;
    trackEvent("order_placed", {
      value: total,
      method: form.payment,
      district: form.district,
      province: form.province,
      deliveryFee,
      giftWrap: form.giftWrap,
    });

    try {
      const apiOrder = await createCheckoutOrder({
        customer: { name: form.name, email: form.email || `${form.phone.replace(/\D/g, "")}@guest.glamonepal.local`, phone: form.phone },
        shippingAddress: {
          fullName: form.name,
          phone: form.phone,
          province: form.province,
          district: form.district,
          city: form.city,
          ward: form.ward,
          addressLine1: form.address,
        },
        items,
        paymentMethod: paymentCodeMap[form.payment] || "cod",
        giftWrap: form.giftWrap,
        orderNotes: form.notes,
        deliveryFee,
        subtotal,
        grandTotal: total,
        currency: "NPR",
      });
      orderNumber = apiOrder.data?.orderNumber || orderNumber;
    } catch {
      toast.error("Order saved locally. GLAMO will reconcile it from your order details.");
    }

    await placeOrder({
      orderNumber,
      total,
      paymentMethod: form.payment,
      shippingAddress,
      customerName: form.name,
      customerPhone: form.phone,
      items: items.map((item) => ({
        name: item.product.name,
        brand: item.product.brand,
        image: item.product.image,
        price: item.product.price,
        quantity: item.quantity,
        selectedShade: item.selectedShade,
      })),
    });
    clearCart();
    router.push("/checkout/success");
  }

  if (!items.length) {
    return (
      <main className="bg-brand-bgLight py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-brand-border bg-white p-8 text-center shadow-sm md:p-12">
            <ShoppingBag className="mx-auto mb-5 text-brand-primary/45" size={70} />
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-primary">Checkout</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-5xl">Your beauty bag is empty</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-brand-textMuted">Add skincare, makeup or routine picks before opening checkout.</p>
            <Link href="/shop" className="mt-8 inline-flex rounded-full bg-brand-primary px-8 py-3 font-semibold text-white transition hover:bg-brand-primary-hover">
              Return to shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-bgLight py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-brand-border bg-[linear-gradient(135deg,#FFFDFC_0%,#F8EEF2_48%,#F7F1EA_100%)] p-6 shadow-sm md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-secondary/40 blur-3xl" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Secure checkout · NPR totals</p>
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-brand-textPrimary md:text-4xl">Complete your order</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-textMuted">Confirm delivery details, payment preference and order summary.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-[1.5rem] border border-white/80 bg-white/75 p-4 backdrop-blur">
              {checkoutSteps.map((step, index) => (
                <div key={step} className="rounded-2xl bg-brand-bgLight p-3">
                  <div className={completedSteps[index] ? "h-1.5 rounded-full bg-brand-primary" : "h-1.5 rounded-full bg-brand-secondary/35"} />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">{index + 1}. {step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary"><ShieldCheck size={20} /></span>
                <div>
                  <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Customer details</h2>
                  <p className="mt-1 text-sm leading-6 text-brand-textMuted">Use a reachable Nepal mobile number for delivery confirmation.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Field label="Full name" value={form.name} onChange={(value) => updateForm({ name: value })} autoComplete="name" />
                <Field label="Email" type="email" value={form.email} onChange={(value) => updateForm({ email: value })} autoComplete="email" required={false} />
                <Field label="Nepal phone" value={form.phone} onChange={(value) => updateForm({ phone: value })} placeholder="+977 9818212188" error={form.phone && !phoneValid ? "Use a valid Nepal mobile number" : ""} autoComplete="tel" />
                <label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
                  Province
                  <select value={form.province} onChange={(event) => updateProvince(event.target.value)} className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
                    {PROVINCES.map((province) => <option key={province}>{province}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
                  District
                  <select value={form.district} onChange={(event) => updateForm({ district: event.target.value })} className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
                    {districtOptions.map((district) => <option key={district}>{district}</option>)}
                  </select>
                </label>
                <Field label="City / Municipality" value={form.city} onChange={(value) => updateForm({ city: value })} autoComplete="address-level2" />
                <Field label="Ward" value={form.ward} onChange={(value) => updateForm({ ward: value })} />
                <Field label="Address" value={form.address} onChange={(value) => updateForm({ address: value })} autoComplete="street-address" />
              </div>
              <div className="mt-5"><CodAvailabilityChecker district={form.district} province={form.province} /></div>
              <div className="mt-5 rounded-[1.5rem] border border-brand-secondary/25 bg-brand-bgLight p-4">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 text-brand-primary" size={18} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-textPrimary">Delivery estimate: {deliveryRule.estimate}</p>
                    <p className="mt-1 text-xs text-brand-textMuted">Free delivery threshold for this route: {formatNpr(freeDelivery.threshold)}.</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-brand-primary" style={{ width: `${freeDelivery.percent}%` }} />
                    </div>
                    {freeDelivery.remaining > 0 ? <p className="mt-2 text-xs text-brand-textMuted">Add {formatNpr(freeDelivery.remaining)} more for free delivery on this route.</p> : <p className="mt-2 text-xs font-semibold text-emerald-700">Free delivery unlocked.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-7">
              <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Payment</h2>
              <p className="mt-1 text-sm leading-6 text-brand-textMuted">Select your preferred payment method.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {paymentMethods.map((method) => {
                  const disabled = method === "Cash on Delivery" && !deliveryRule.codAvailable;
                  return (
                    <label key={method} className={`rounded-2xl border p-4 text-sm font-semibold transition ${form.payment === method ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-brand-bgLight text-brand-textPrimary"} ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={form.payment === method}
                        disabled={disabled}
                        onChange={(event) => updateForm({ payment: event.target.value })}
                        className="sr-only"
                      />
                      <span>{method}</span>
                      {method !== "Cash on Delivery" ? <span className="mt-1 block text-xs opacity-75">Manual confirmation ready</span> : null}
                    </label>
                  );
                })}
              </div>
              {form.payment !== "Cash on Delivery" ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <AlertCircle className="mb-2" size={18} /> Online payment confirmation will be handled by the payment provider after you place your order.
                </div>
              ) : null}
              <label className="mt-5 flex items-center gap-3 rounded-2xl bg-brand-bgLight p-4 text-sm font-semibold text-brand-textPrimary">
                <input type="checkbox" checked={form.giftWrap} onChange={(event) => updateForm({ giftWrap: event.target.checked })} className="h-4 w-4 rounded border-brand-border text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
                <Gift size={18} /> Add gift wrapping for NPR 100
              </label>
              <label className="mt-5 block space-y-2 text-sm font-semibold text-brand-textPrimary">
                Order notes
                <textarea value={form.notes} onChange={(event) => updateForm({ notes: event.target.value })} rows={4} className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Delivery notes, preferred time, gift message..." />
              </label>
            </div>
          </section>

          <aside className="h-fit rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6 lg:sticky lg:top-[calc(var(--total-header-height)+24px)]">
            <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Order summary</h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedShade || "default"}`} className="flex gap-3 rounded-2xl bg-brand-bgLight p-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-brand-textPrimary">{item.product.name}</p>
                    <p className="mt-0.5 text-xs text-brand-textMuted">Qty {item.quantity}{item.selectedShade ? ` · ${item.selectedShade}` : ""}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-textPrimary">{formatNpr(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-brand-textMuted">Subtotal</span><span>{formatNpr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-brand-textMuted">Delivery</span><span>{deliveryFee ? formatNpr(deliveryFee) : "Free"}</span></div>
              <div className="flex justify-between"><span className="text-brand-textMuted">Gift wrap</span><span>{giftWrapFee ? formatNpr(giftWrapFee) : "No"}</span></div>
              <div className="flex justify-between border-t border-brand-border pt-4 text-xl"><span className="font-semibold">Total</span><span className="font-bold text-brand-primary">{formatNpr(total)}</span></div>
            </div>
            <button disabled={!canSubmit || status === "pending"} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-4 font-semibold text-white transition hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:cursor-not-allowed disabled:bg-brand-textMuted">
              <LockKeyhole size={18} />{status === "pending" ? "Placing order..." : "Place order"}
            </button>
            {status === "success" ? <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16} /> Order placed successfully.</p> : null}
            <p className="mt-4 text-xs leading-relaxed text-brand-textMuted">Need help before placing your order? WhatsApp GLAMO for delivery and payment support.</p>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  autoComplete,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-brand-border bg-brand-bgLight px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30"
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
