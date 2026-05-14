"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Gift, LockKeyhole, ShieldCheck, ShoppingBag, Truck, XCircle } from "lucide-react";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";

import type { PaymentMethodCode } from "@/lib/api/contracts";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { PROVINCES, getDistrictsForProvince, getMunicipalitiesForDistrict, type Province, type District } from "@/lib/nepal-locations";
import { calculateDeliveryFee, getDeliveryRule, getFreeDeliveryProgress } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { checkoutSchema, type CheckoutFormData } from "@/lib/validations/checkout";

const paymentMethods = ["Cash on Delivery", "Khalti", "eSewa", "Cards"] as const;
const comingSoonMethods = new Set(["Khalti", "eSewa", "Cards"]);

const paymentCodeMap: Record<string, PaymentMethodCode> = {
  "Cash on Delivery": "cod",
  Khalti: "khalti",
  eSewa: "esewa",
  Cards: "card",
};
const checkoutSteps = ["Contact", "Delivery", "Payment", "Review"];

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { status, error, placeOrder } = useCheckoutStore();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: {
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
    },
  });

  const form = watch();
  const municipalityOptions = useMemo(() => getMunicipalitiesForDistrict(form.district as District), [form.district]);
  const [showOtherCity, setShowOtherCity] = useState(false);
  const subtotal = getSubtotal();
  const deliveryRule = getDeliveryRule(form.district, form.province);
  const deliveryFee = calculateDeliveryFee(subtotal, form.district, form.province);
  const freeDelivery = getFreeDeliveryProgress(subtotal, form.district, form.province);
  const giftWrapFee = form.giftWrap ? 100 : 0;
  const total = subtotal + deliveryFee + giftWrapFee;
  const districtOptions = useMemo(() => getDistrictsForProvince(form.province as Province), [form.province]);
  const canSubmit = Boolean(
    isValid &&
      items.length > 0 &&
      (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable),
  );

  useEffect(() => {
    if (items.length) trackEvent("checkout_started", { value: subtotal });
  }, [items.length, subtotal]);

  const completedSteps = [
    Boolean(form.name.trim() && form.phone.trim() && !errors.name && !errors.phone),
    Boolean(form.province && form.district && form.city.trim() && form.ward.trim() && form.address.trim() && !errors.city && !errors.ward && !errors.address),
    Boolean(form.payment && (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable)),
    canSubmit,
  ];

  function updateProvince(province: string) {
    const districts = getDistrictsForProvince(province as Province);
    setValue("province", province, { shouldValidate: true });
    setValue("district", districts[0] || "Kathmandu", { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
    setShowOtherCity(false);
  }

  function updateDistrict(district: string) {
    setValue("district", district, { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
    setShowOtherCity(false);
  }

  async function onSubmit(data: CheckoutFormData) {
    const orderNumber = `GLM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingAddress = `${data.address}, Ward ${data.ward}, ${data.city}, ${data.district}, ${data.province}, Nepal`;
    trackEvent("order_placed", {
      value: total,
      method: data.payment,
      district: data.district,
      province: data.province,
      deliveryFee,
      giftWrap: data.giftWrap,
    });

    try {
      await placeOrder(
        {
          orderNumber,
          total,
          paymentMethod: data.payment,
          shippingAddress,
          customerName: data.name,
          customerPhone: data.phone,
          items: items.map((item) => ({
            name: item.product.name,
            brand: item.product.brand,
            image: item.product.image,
            price: item.product.price,
            quantity: item.quantity,
            selectedShade: item.selectedShade,
          })),
        },
        {
          customer: { name: data.name, email: data.email || `${data.phone.replace(/\D/g, "")}@guest.glamonepal.local`, phone: data.phone },
          shippingAddress: {
            fullName: data.name,
            phone: data.phone,
            province: data.province,
            district: data.district,
            city: data.city,
            ward: data.ward,
            addressLine1: data.address,
          },
          items: items.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            selectedShade: item.selectedShade,
            image: item.product.image,
            brand: item.product.brand,
          })),
          paymentMethod: paymentCodeMap[data.payment] || "cod",
          giftWrap: data.giftWrap,
          orderNotes: data.notes,
          deliveryFee,
          subtotal,
          grandTotal: total,
          currency: "NPR" as const,
        },
      );
    } catch {
      return;
    }
    router.push("/checkout/success");
    clearCart();
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
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Secure checkout · रू totals</p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">
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
                <Field label="Full name" register={register("name")} error={errors.name?.message} autoComplete="name" />
                <Field label="Email" type="email" register={register("email")} error={errors.email?.message} autoComplete="email" required={false} />
                <Field label="Nepal phone" register={register("phone")} placeholder="+977 9818212188" error={errors.phone?.message} autoComplete="tel" />
                <label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
                  Province
                  <select {...register("province")} onChange={(e) => updateProvince(e.target.value)} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
                    {PROVINCES.map((province) => <option key={province}>{province}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
                  District
                  <select {...register("district")} onChange={(e) => updateDistrict(e.target.value)} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
                    {districtOptions.map((district) => <option key={district}>{district}</option>)}
                  </select>
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-brand-textPrimary">City / Municipality</label>
                  {!showOtherCity ? (
                    <select
                      {...register("city")}
                      onChange={(e) => {
                        if (e.target.value === "__other__") {
                          setShowOtherCity(true);
                          setValue("city", "", { shouldValidate: true });
                        } else {
                          setValue("city", e.target.value, { shouldValidate: true });
                        }
                      }}
                      value={showOtherCity ? "__other__" : form.city}
                      className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand-primary/30"
                    >
                      <option value="">Select city / municipality</option>
                      {municipalityOptions.map((m) => (
                        <option key={m.name} value={m.name}>{m.name} ({m.type})</option>
                      ))}
                      <option value="__other__">Other (type below)</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        {...register("city")}
                        placeholder="Enter your city / municipality"
                        className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand-primary/30"
                      />
                      <button type="button" onClick={() => { setShowOtherCity(false); setValue("city", municipalityOptions[0]?.name ?? "", { shouldValidate: true }); }} className="text-xs text-brand-primary underline">Back to list</button>
                    </div>
                  )}
                  {errors.city && <span role="alert" className="text-xs text-red-600">{errors.city.message}</span>}
                </div>
                <Field label="Ward" register={register("ward")} error={errors.ward?.message} />
                <Field label="Address" register={register("address")} error={errors.address?.message} autoComplete="street-address" />
              </div>
              <div className="mt-5"><CodAvailabilityChecker district={form.district} province={form.province} /></div>
<div className="mt-5 rounded-[1.5rem] border border-brand-secondary/25 bg-brand-bgLight p-4">
                  <div className="flex items-start gap-3">
                    <Truck className="mt-0.5 text-brand-primary" size={18} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-brand-textPrimary">
                          Delivery: {deliveryFee ? formatNPR(deliveryFee) : "FREE"}
                        </p>
                        {deliveryRule.codAvailable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 size={12} /> COD available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            <XCircle size={12} /> Prepaid only
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-brand-textMuted">Estimated delivery: {deliveryRule.estimate}</p>
                      <p className="mt-1 text-xs text-brand-textMuted">Free delivery threshold for this route: {formatNPR(freeDelivery.threshold)}.</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${freeDelivery.percent}%` }} />
                      </div>
                      {freeDelivery.remaining > 0 ? <p className="mt-2 text-xs text-brand-textMuted">Add {formatNPR(freeDelivery.remaining)} more for free delivery on this route.</p> : <p className="mt-2 text-xs font-semibold text-emerald-700">Free delivery unlocked.</p>}
                    </div>
                  </div>
                </div>
            </div>

            <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-7">
              <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Payment</h2>
              <p className="mt-1 text-sm leading-6 text-brand-textMuted">Select your preferred payment method.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {paymentMethods.map((method) => {
                  const disabled = (method === "Cash on Delivery" && !deliveryRule.codAvailable) || comingSoonMethods.has(method);
                  return (
                    <label key={method} className={`rounded-2xl border p-4 text-sm font-semibold transition ${form.payment === method ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-brand-bgLight text-brand-textPrimary"} ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
                      <input
                        type="radio"
                        {...register("payment")}
                        value={method}
                        disabled={disabled}
                        className="sr-only"
                      />
                      <span>{method}</span>
                      {comingSoonMethods.has(method) ? <span className="mt-1 block text-xs opacity-75">Coming soon</span> : method === "Cash on Delivery" ? null : <span className="mt-1 block text-xs opacity-75">Manual confirmation ready</span>}
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
                <input type="checkbox" {...register("giftWrap")} className="h-4 w-4 rounded border-brand-border text-brand-primary accent-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
                <Gift size={18} /> Add gift wrapping for रू 100
              </label>
              <label className="mt-5 block space-y-2 text-sm font-semibold text-brand-textPrimary">
                Order notes
                <textarea {...register("notes")} rows={4} className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand-primary/30" placeholder="Delivery notes, preferred time, gift message..." />
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
                  <span className="text-sm font-bold text-brand-textPrimary">{formatNPR(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-brand-textMuted">Subtotal</span><span>{formatNPR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-brand-textMuted">Delivery</span><span>{deliveryFee ? formatNPR(deliveryFee) : "Free"}</span></div>
              <div className="flex justify-between"><span className="text-brand-textMuted">Gift wrap</span><span>{giftWrapFee ? formatNPR(giftWrapFee) : "No"}</span></div>
              <div className="flex justify-between border-t border-brand-border pt-4 text-xl"><span className="font-semibold">Total</span><span className="font-bold text-brand-gold">{formatNPR(total)}</span></div>
            </div>
            <button disabled={!canSubmit || status === "pending"} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-6 py-4 font-semibold text-white transition hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:cursor-not-allowed disabled:bg-brand-textMuted">
              <LockKeyhole size={18} />{status === "pending" ? "Placing order..." : "Place order"}
            </button>
            {status === "success" ? <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={16} /> Order placed successfully.</p> : null}
            {status === "failed" && error ? <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertCircle size={16} /> {error}</p> : null}
            <p className="mt-4 text-xs leading-relaxed text-brand-textMuted">Need help before placing your order? WhatsApp GLAMO for delivery and payment support.</p>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  register: registerProps,
  type = "text",
  placeholder,
  error,
  autoComplete,
  required = true,
}: {
  label: string;
  register: Record<string, unknown>;
  type?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = `${id}-error`;
  return (
    <label className="space-y-2 text-sm font-semibold text-brand-textPrimary">
      {label}
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        {...registerProps}
        className={`w-full rounded-xl border bg-brand-bgLight px-4 py-3 text-base font-normal outline-none focus:ring-2 focus:ring-brand-primary/30 ${error ? "border-red-500" : "border-brand-border"}`}
      />
      {error ? <span id={errorId} role="alert" className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}