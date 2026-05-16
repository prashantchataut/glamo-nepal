"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Truck, CreditCard, ClipboardCheck, ShoppingBag } from "lucide-react";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";
import type { PaymentMethodCode } from "@/lib/api/contracts";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { PROVINCES, getDistrictsForProvince, getMunicipalitiesForDistrict, type Province, type District } from "@/lib/nepal-locations";
import { calculateDeliveryFee, getDeliveryRule } from "@/lib/delivery";
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

const steps = [
  { label: "Contact & Shipping", icon: Truck },
  { label: "Delivery", icon: Truck },
  { label: "Payment", icon: CreditCard },
  { label: "Review", icon: ClipboardCheck },
];

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { placeOrder } = useCheckoutStore();
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
  const municipalityNames = useMemo(() => getMunicipalitiesForDistrict(form.district as District).map((m) => m.name), [form.district]);
  const subtotal = getSubtotal();
  const deliveryRule = getDeliveryRule(form.district, form.province);
  const deliveryFee = calculateDeliveryFee(subtotal, form.district, form.province);
  const giftWrapFee = form.giftWrap ? 100 : 0;
  const total = subtotal + deliveryFee + giftWrapFee;
  const districtOptions = useMemo(() => getDistrictsForProvince(form.province as Province), [form.province]);

  const canSubmit = Boolean(
    isValid && items.length > 0 && (form.payment !== "Cash on Delivery" || deliveryRule.codAvailable)
  );

  const inputClass = "w-full border-b border-neutral-300 bg-transparent px-0 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none";
  const labelClass = "type-label text-[11px] text-neutral-400 mb-2 block";
  const errorClass = "mt-1 text-xs text-error";

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

  async function onSubmit(data: CheckoutFormData) {
    setIsSubmitting(true);
    const shippingAddress = `${data.address}, Ward ${data.ward}, ${data.city}, ${data.district}, ${data.province}, Nepal`;
    trackEvent("order_placed", { value: total, method: data.payment, district: data.district, province: data.province, deliveryFee, giftWrap: data.giftWrap });

    let order: Awaited<ReturnType<typeof placeOrder>>;
    try {
      order = await placeOrder(
        { orderNumber: "", total, paymentMethod: data.payment, shippingAddress, customerName: data.name, customerPhone: data.phone,
          items: items.map((item) => ({ name: item.product.name, brand: item.product.brand, image: item.product.image, price: item.product.price, quantity: item.quantity, selectedShade: item.selectedShade })),
        },
        { customer: { name: data.name, email: data.email || `${data.phone.replace(/\D/g, "")}@guest.glamonepal.local`, phone: data.phone },
          shippingAddress: { fullName: data.name, phone: data.phone, province: data.province, district: data.district, city: data.city, ward: data.ward, addressLine1: data.address },
          items: items.map((item) => ({ productId: item.product.id, name: item.product.name, price: item.product.price, quantity: item.quantity, selectedShade: item.selectedShade, image: item.product.image, brand: item.product.brand })),
          paymentMethod: paymentCodeMap[data.payment] || "cod", giftWrap: data.giftWrap, orderNotes: data.notes, deliveryFee, subtotal, grandTotal: total, currency: "NPR" as const,
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
      <main className="bg-neutral-50 py-16 md:py-24">
        <div className="mx-auto max-w-lg text-center px-4">
          <ShoppingBag size={48} className="mx-auto text-neutral-300" />
          <h1 className="type-display-md text-neutral-900 mt-6">Your bag is empty</h1>
          <p className="type-body-md text-neutral-400 mt-3">Add items before checking out.</p>
          <Link href="/shop" className="mt-8 inline-flex items-center justify-center bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark cursor-pointer">
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-neutral-50 py-8 md:py-12 page-padding">
      <div className="mx-auto max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center text-[12px] font-medium transition-colors ${
                i <= currentStep ? "bg-primary text-white" : "bg-neutral-200 text-neutral-400"
              }`}>
                {i < currentStep ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`ml-2 hidden sm:inline text-[12px] tracking-wide ${
                i <= currentStep ? "text-neutral-900 font-medium" : "text-neutral-400"
              }`}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-3 h-px w-8 sm:w-16 ${i < currentStep ? "bg-primary" : "bg-neutral-200"}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 0: Contact & Shipping */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="type-heading-sm text-neutral-900">Contact & Shipping</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className={labelClass}>Full Name</label>
                  <input id="name" {...register("name")} className={inputClass} placeholder="Your full name" />
                  {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>Phone Number</label>
                  <input id="phone" {...register("phone")} className={inputClass} placeholder="98XXXXXXXX" />
                  {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Email (optional)</label>
                <input id="email" type="email" {...register("email")} className={inputClass} placeholder="your@email.com" />
                {errors.email && <p className={errorClass}>{errors.email.message}</p>}
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="province" className={labelClass}>Province</label>
                  <select id="province" {...register("province")} onChange={(e) => updateProvince(e.target.value)} className={inputClass}>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className={labelClass}>District</label>
                  <select id="district" {...register("district")} onChange={(e) => updateDistrict(e.target.value)} className={inputClass}>
                    {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className={errorClass}>{errors.district.message}</p>}
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className={labelClass}>City / Municipality</label>
                  <select id="city" {...register("city")} className={inputClass}>
                    {municipalityNames.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errors.city && <p className={errorClass}>{errors.city.message}</p>}
                </div>
                <div>
                  <label htmlFor="ward" className={labelClass}>Ward</label>
                  <input id="ward" {...register("ward")} className={inputClass} placeholder="Ward number" />
                  {errors.ward && <p className={errorClass}>{errors.ward.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="address" className={labelClass}>Street Address</label>
                <input id="address" {...register("address")} className={inputClass} placeholder="House no., street, locality" />
                {errors.address && <p className={errorClass}>{errors.address.message}</p>}
              </div>
              <button type="button" onClick={() => setCurrentStep(1)} disabled={!form.name || !form.phone || !form.address || !form.ward} className="bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark disabled:bg-neutral-400 disabled:cursor-not-allowed cursor-pointer">
                Continue to Delivery
              </button>
            </div>
          )}

          {/* Step 1: Delivery */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="type-heading-sm text-neutral-900">Delivery Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-4 border border-neutral-200 p-4 cursor-pointer hover:border-primary transition-colors">
                  <input type="radio" name="delivery" defaultChecked className="accent-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">Standard Delivery</p>
                    <p className="type-body-sm text-neutral-400">3-5 business days</p>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">{deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}</span>
                </label>
                {deliveryFee > 0 && subtotal < 2000 && (
                  <p className="type-body-sm text-neutral-400">Free delivery on orders over {formatNPR(2000)}</p>
                )}
              </div>
              <CodAvailabilityChecker district={form.district} province={form.province} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setCurrentStep(0)} className="border border-neutral-200 px-6 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-700 transition-colors hover:border-neutral-400 cursor-pointer">
                  Back
                </button>
                <button type="button" onClick={() => setCurrentStep(2)} className="bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark cursor-pointer">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="type-heading-sm text-neutral-900">Payment Method</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const isComingSoon = comingSoonMethods.has(method);
                  return (
                    <label key={method} className={`flex items-center gap-4 border p-4 cursor-pointer transition-colors ${form.payment === method ? "border-primary" : "border-neutral-200 hover:border-neutral-400"} ${isComingSoon ? "opacity-50" : ""}`}>
                      <input type="radio" {...register("payment")} value={method} disabled={isComingSoon} className="accent-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{method}</p>
                        {isComingSoon && <p className="type-body-sm text-neutral-400">Coming soon</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setCurrentStep(1)} className="border border-neutral-200 px-6 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-700 transition-colors hover:border-neutral-400 cursor-pointer">
                  Back
                </button>
                <button type="button" onClick={() => setCurrentStep(3)} className="bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark cursor-pointer">
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Place Order */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="type-heading-sm text-neutral-900">Review Your Order</h2>

              {/* Order items */}
              <div className="border border-neutral-200 divide-y divide-neutral-200">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedShade}`} className="flex gap-4 p-4">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-neutral-100">
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="type-label text-[10px] text-neutral-400">{item.product.brand}</p>
                      <p className="text-sm font-medium text-neutral-900 truncate">{item.product.name}</p>
                      {item.selectedShade && <p className="type-body-sm text-neutral-400">Shade: {item.selectedShade}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-neutral-900">{formatNPR(item.product.price * item.quantity)}</p>
                      <p className="type-body-sm text-neutral-400">Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border border-neutral-200 p-6">
                <div className="space-y-3 type-body-sm">
                  <div className="flex justify-between text-neutral-400"><span>Subtotal</span><span className="text-neutral-900">{formatNPR(subtotal)}</span></div>
                  <div className="flex justify-between text-neutral-400"><span>Shipping</span><span className="text-neutral-900">{deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}</span></div>
                  <div className="border-t border-neutral-200 pt-3 flex justify-between">
                    <span className="font-medium text-neutral-900">Total</span>
                    <span className="type-price text-neutral-900">{formatNPR(total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping summary */}
              <div className="border border-neutral-200 p-4 type-body-sm text-neutral-400">
                <p className="font-medium text-neutral-900 mb-1">Shipping to</p>
                <p>{form.name}</p>
                <p>{form.address}, Ward {form.ward}, {form.city}, {form.district}, {form.province}</p>
                <p>{form.phone}</p>
                <p className="mt-2 font-medium text-neutral-900">Payment: {form.payment}</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setCurrentStep(2)} className="border border-neutral-200 px-6 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-700 transition-colors hover:border-neutral-400 cursor-pointer">
                  Back
                </button>
                <button type="submit" disabled={!canSubmit || isSubmitting} className="flex-1 bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark disabled:bg-neutral-400 disabled:cursor-not-allowed cursor-pointer">
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}