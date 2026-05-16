"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Gift,
  LockKeyhole,
  MapPin,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";
import type { PaymentMethodCode } from "@/lib/api/contracts";
import { trackEvent } from "@/lib/analytics";
import { calculateDeliveryFee, getDeliveryRule } from "@/lib/delivery";
import {
  PROVINCES,
  getDistrictsForProvince,
  getMunicipalitiesForDistrict,
  type District,
  type Province,
} from "@/lib/nepal-locations";
import { formatNPR } from "@/lib/utils";
import {
  checkoutSchema,
  type CheckoutFormData,
} from "@/lib/validations/checkout";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";

const paymentMethods = [
  { label: "Cash on Delivery", helper: "Pay when your GLAMO parcel arrives.", badge: "Most flexible" },
  { label: "Khalti", helper: "Order is created now; payment verification stays pending until gateway keys are connected.", badge: "Verification pending" },
  { label: "eSewa", helper: "Order is created now; eSewa payment status remains pending for manual follow-up.", badge: "Verification pending" },
] as const;
const paymentCodeMap: Record<string, PaymentMethodCode> = {
  "Cash on Delivery": "cod",
  Khalti: "khalti",
  eSewa: "esewa",
  Cards: "card",
};

const steps = [
  { label: "Address", icon: MapPin },
  { label: "Delivery", icon: Truck },
  { label: "Payment", icon: CreditCard },
  { label: "Review", icon: ClipboardCheck },
];

function OrderSummary({
  subtotal,
  deliveryFee,
  giftWrapFee,
  total,
}: {
  subtotal: number;
  deliveryFee: number;
  giftWrapFee: number;
  total: number;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between text-cream-400">
        <span>Subtotal</span>
        <span className="text-ink">{formatNPR(subtotal)}</span>
      </div>
      <div className="flex justify-between text-cream-400">
        <span>Delivery</span>
        <span className="text-ink">
          {deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}
        </span>
      </div>
      {giftWrapFee > 0 && (
        <div className="flex justify-between text-cream-400">
          <span>Gift wrap</span>
          <span className="text-ink">{formatNPR(giftWrapFee)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-cream-200 pt-4 text-ink">
        <span className="font-semibold">Total</span>
        <span className="font-display text-3xl font-semibold leading-none">
          {formatNPR(total)}
        </span>
      </div>
    </div>
  );
}

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { placeOrder, error: checkoutError, reset: resetCheckout } = useCheckoutStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const subtotal = getSubtotal();
  const deliveryRule = getDeliveryRule(form.district, form.province);
  const deliveryFee = calculateDeliveryFee(
    subtotal,
    form.district,
    form.province,
  );
  const giftWrapFee = form.giftWrap ? 100 : 0;
  const total = subtotal + deliveryFee + giftWrapFee;
  const districtOptions = useMemo(
    () => getDistrictsForProvince(form.province as Province),
    [form.province],
  );
  const municipalityNames = useMemo(
    () =>
      getMunicipalitiesForDistrict(form.district as District).map(
        (m) => m.name,
      ),
    [form.district],
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const canSubmit = Boolean(
    isValid &&
    items.length > 0 &&
    (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable),
  );

  const inputClass =
    "w-full rounded-[1.35rem] border border-cream-200 bg-white/80 px-4 py-3.5 text-sm text-ink placeholder:text-cream-400 shadow-[0_14px_38px_-34px_rgba(26,15,11,0.32)] outline-none transition-all focus:border-brand-rose focus:bg-white focus:ring-2 focus:ring-primary/15";
  const labelClass =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-cream-400";
  const errorClass = "mt-1.5 text-xs text-error";

  function updateProvince(province: string) {
    const districts = getDistrictsForProvince(province as Province);
    setValue("province", province, { shouldValidate: true });
    setValue("district", districts[0] || "Kathmandu", { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
  }

  function updateDistrict(district: string) {
    setValue("district", district, { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
  }

  function stepButton(step: number) {
    return currentStep === step
      ? "bg-ink text-white"
      : currentStep > step
        ? "bg-brand-rose text-white"
        : "bg-cream-50 text-cream-400";
  }

  async function onSubmit(data: CheckoutFormData) {
    resetCheckout();
    setIsSubmitting(true);
    const shippingAddress = `${data.address}, Ward ${data.ward}, ${data.city}, ${data.district}, ${data.province}, Nepal`;
    trackEvent("order_placed", {
      value: total,
      method: data.payment,
      district: data.district,
      province: data.province,
      deliveryFee,
      giftWrap: data.giftWrap,
    });

    let order: Awaited<ReturnType<typeof placeOrder>>;
    try {
      order = await placeOrder(
        {
          orderNumber: "",
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
          customer: {
            name: data.name,
            email:
              data.email ||
              `${data.phone.replace(/\D/g, "")}@guest.glamonepal.local`,
            phone: data.phone,
          },
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
      setIsSubmitting(false);
      return;
    }

    router.push(`/order-confirmation/${order.orderNumber}`);
    clearCart();
  }

  if (!items.length) {
    return (
      <main className="bg-cream-50 py-16 md:py-24">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blush text-brand-rose">
            <ShoppingBag size={30} />
          </div>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-ink">
            Your bag is empty
          </h1>
          <p className="mt-4 text-sm leading-7 text-cream-400">
            Add items before checking out.
          </p>
          <Link
            href="/shop"
            className="luxury-button luxury-button-dark mt-8"
          >
            Start shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream-50 px-4 py-8 md:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] bg-brand-blush/85 px-5 py-6 shadow-[0_22px_70px_-56px_rgba(168,77,94,0.38)] md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-rose">
            Secure checkout
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-ink md:text-7xl">
              Confirm your beauty bag.
            </h1>
            <p className="max-w-sm text-sm leading-7 text-cream-700">
              Delivery rules are Nepal-aware. Digital payments stay marked
              coming soon until the gateway is ready.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
          <section className="rounded-[2rem] border border-cream-200 bg-cream-50/95 p-5 shadow-[0_24px_82px_-58px_rgba(26,21,18,0.58)] md:p-7">
            <div className="mb-8 grid grid-cols-4 gap-2">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => setCurrentStep(i)}
                    className="text-left"
                    aria-current={currentStep === i ? "step" : undefined}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${stepButton(i)}`}
                    >
                      {i < currentStep ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Icon size={17} />
                      )}
                    </div>
                    <span
                      className={`mt-2 hidden text-xs font-semibold uppercase tracking-[0.12em] sm:block ${i <= currentStep ? "text-ink" : "text-cream-400"}`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {currentStep === 0 && (
                <div className="space-y-5">
                  <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">
                    Contact & shipping
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Full name
                      </label>
                      <input
                        id="name"
                        {...register("name")}
                        className={inputClass}
                        placeholder="Your full name"
                      />
                      {errors.name && (
                        <p className={errorClass}>{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        Phone number
                      </label>
                      <input
                        id="phone"
                        {...register("phone")}
                        className={inputClass}
                        placeholder="98XXXXXXXX"
                      />
                      {errors.phone && (
                        <p className={errorClass}>{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email optional
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={inputClass}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className={errorClass}>{errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="province" className={labelClass}>
                        Province
                      </label>
                      <select
                        id="province"
                        {...register("province")}
                        onChange={(e) => updateProvince(e.target.value)}
                        className={inputClass}
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="district" className={labelClass}>
                        District
                      </label>
                      <select
                        id="district"
                        {...register("district")}
                        onChange={(e) => updateDistrict(e.target.value)}
                        className={inputClass}
                      >
                        {districtOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      {errors.district && (
                        <p className={errorClass}>{errors.district.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="city" className={labelClass}>
                        City / municipality
                      </label>
                      <select
                        id="city"
                        {...register("city")}
                        className={inputClass}
                      >
                        {municipalityNames.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      {errors.city && (
                        <p className={errorClass}>{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="ward" className={labelClass}>
                        Ward
                      </label>
                      <input
                        id="ward"
                        {...register("ward")}
                        className={inputClass}
                        placeholder="Ward number"
                      />
                      {errors.ward && (
                        <p className={errorClass}>{errors.ward.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="address" className={labelClass}>
                      Street address
                    </label>
                    <input
                      id="address"
                      {...register("address")}
                      className={inputClass}
                      placeholder="House no., street, locality"
                    />
                    {errors.address && (
                      <p className={errorClass}>{errors.address.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    disabled={
                      !form.name || !form.phone || !form.address || !form.ward
                    }
                    className="luxury-button luxury-button-dark disabled:cursor-not-allowed disabled:bg-neutral-300"
                  >
                    Continue to delivery
                  </button>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-5">
                  <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">
                    Delivery method
                  </h2>
                  <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-brand-rose bg-cream-50 p-5">
                    <input
                      type="radio"
                      name="delivery"
                      defaultChecked
                      className="accent-primary"
                    />
                    <Truck className="text-brand-rose" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">
                        Standard delivery
                      </p>
                      <p className="mt-1 text-xs text-cream-400">
                        {deliveryRule.estimate}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}
                    </span>
                  </label>
                  <CodAvailabilityChecker
                    district={form.district}
                    province={form.province}
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="luxury-button luxury-button-light"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="luxury-button luxury-button-dark"
                    >
                      Continue to payment
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-5">
                  <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">
                    Payment method
                  </h2>
                  <div className="grid gap-3">
                    {paymentMethods.map((method) => {
                      return (
                        <label
                          key={method.label}
                          className={`flex cursor-pointer items-center gap-4 rounded-[1.35rem] border p-5 transition-all hover:-translate-y-0.5 ${form.payment === method.label ? "border-brand-rose bg-brand-blush/35 shadow-[0_18px_52px_-42px_rgba(168,77,94,0.5)]" : "border-cream-200 bg-white/60 hover:border-brand-rose/45"}`}
                        >
                          <input
                            type="radio"
                            {...register("payment")}
                            value={method.label}
                            className="accent-primary"
                          />
                          <CreditCard size={19} className="text-brand-rose" />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-ink">
                                {method.label}
                              </p>
                              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-brand-deep">
                                {method.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-cream-500">
                              {method.helper}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <label className="flex items-center gap-3 rounded-[1.35rem] border border-cream-200 bg-white/60 p-5 text-sm text-cream-700">
                    <input
                      type="checkbox"
                      {...register("giftWrap")}
                      className="accent-primary"
                    />
                    <Gift size={18} className="text-brand-rose" /> Add gift wrap
                    for {formatNPR(100)}
                  </label>
                  <div>
                    <label htmlFor="notes" className={labelClass}>
                      Order notes
                    </label>
                    <textarea
                      id="notes"
                      {...register("notes")}
                      className={`${inputClass} min-h-28`}
                      placeholder="Delivery note, gift message or preferred call time"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="luxury-button luxury-button-light"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="luxury-button luxury-button-dark"
                    >
                      Review order
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink">
                    Review order
                  </h2>
                  <div className="divide-y divide-neutral-200 rounded-2xl border border-cream-200">
                    {items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.selectedShade || "base"}`}
                        className="flex gap-4 p-4"
                      >
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[1rem] bg-cream-100">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream-400">
                            {item.product.brand}
                          </p>
                          <p className="truncate text-sm font-semibold text-ink">
                            {item.product.name}
                          </p>
                          {item.selectedShade && (
                            <p className="text-xs text-cream-400">
                              Shade: {item.selectedShade}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-ink">
                            {formatNPR(item.product.price * item.quantity)}
                          </p>
                          <p className="text-xs text-cream-400">
                            Qty {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.35rem] border border-cream-200 bg-white/70 p-5">
                    <OrderSummary
                      subtotal={subtotal}
                      deliveryFee={deliveryFee}
                      giftWrapFee={giftWrapFee}
                      total={total}
                    />
                  </div>
                  <div className="rounded-[1.35rem] border border-cream-200 bg-white/60 p-5 text-sm leading-7 text-cream-700">
                    <p className="font-semibold text-ink">
                      Shipping to
                    </p>
                    <p>{form.name}</p>
                    <p>
                      {form.address}, Ward {form.ward}, {form.city},{" "}
                      {form.district}, {form.province}
                    </p>
                    <p>{form.phone}</p>
                    <p className="mt-2 font-semibold text-ink">
                      Payment: {form.payment}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="luxury-button luxury-button-light"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="luxury-button luxury-button-dark flex-1 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {isSubmitting ? "Placing order..." : "Place order"}
                    </button>
                  </div>
                </div>
              )}
              {checkoutError && (
                <div className="mt-6 rounded-[1.35rem] border border-error/25 bg-error/5 px-5 py-4 text-sm leading-6 text-error" role="alert">
                  {checkoutError}
                </div>
              )}
            </form>
          </section>

          <aside className="rounded-[2rem] border border-cream-200 bg-cream-50/95 p-6 shadow-editorial lg:sticky lg:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-rose">
              Bag summary
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-ink">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </h2>
            <div className="mt-5 max-h-[360px] space-y-3 overflow-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedShade || "base"}-summary`}
                  className="flex gap-3 rounded-2xl bg-cream-50 p-3"
                >
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[1rem] bg-cream-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-cream-400">
                      Qty {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-cream-200 pt-5">
              <OrderSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                giftWrapFee={giftWrapFee}
                total={total}
              />
            </div>
            <div className="mt-5 flex gap-3 rounded-[1.35rem] bg-ink p-4 text-white">
              <LockKeyhole size={18} className="mt-0.5 text-brand-blush" />
              <p className="text-xs leading-5 text-white/75">
                Checkout stores only necessary order details and redirects to
                confirmation after API order creation.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
