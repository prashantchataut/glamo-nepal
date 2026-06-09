"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Gift,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";
import type { Address, PaymentMethodCode } from "@/lib/api/contracts";
import { customerApi } from "@/lib/api/customer";
import { GlamoApiError } from "@/lib/api/client";
import { getUserMessage } from "@/lib/api/error-handler";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { calculateDeliveryFee, getDeliveryRule, FREE_DELIVERY_THRESHOLD, COD_FEE } from "@/lib/delivery";
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
import { useAuthStore } from "@/store/useAuthStore";
import { initiateKhaltiPayment, initiateEsewaPayment } from "@/lib/api/checkout";

const paymentMethods = [
  "Cash on Delivery",
  "Khalti",
  "eSewa",
] as const;

const hasKhaltiKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY;
const hasEsewaKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_ESEWA_MERCHANT_ID;
const comingSoonMethods = new Set<string>([
  ...(!hasKhaltiKey ? ["Khalti"] : []),
  ...(!hasEsewaKey ? ["eSewa"] : []),
  "Cards",
]);
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
  codFee,
  total,
}: {
  subtotal: number;
  deliveryFee: number;
  giftWrapFee: number;
  codFee: number;
  total: number;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between text-neutral-500">
        <span>Subtotal</span>
        <span className="text-neutral-950">{formatNPR(subtotal)}</span>
      </div>
      <div className="flex justify-between text-neutral-500">
        <span>Delivery</span>
        <span className="text-neutral-950">
          {deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}
        </span>
      </div>
      {codFee > 0 && (
        <div className="flex justify-between text-neutral-500">
          <span>COD fee</span>
          <span className="text-neutral-950">{formatNPR(codFee)}</span>
        </div>
      )}
      {giftWrapFee > 0 && (
        <div className="flex justify-between text-neutral-500">
          <span>Gift wrap</span>
          <span className="text-neutral-950">{formatNPR(giftWrapFee)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-neutral-200 pt-4 text-neutral-950">
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
  const { placeOrder } = useCheckoutStore();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  const isGuest = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("guest");

  useEffect(() => {
    if (!authLoading && user === null && !isGuest) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?redirect=${redirect}&prompt=guest`);
    }
  }, [authLoading, user, router, isGuest]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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

  useEffect(() => {
    if (!user) return;
    if (user.name) setValue("name", user.name);
    if (user.email) setValue("email", user.email);
    if (user.phone) setValue("phone", user.phone);
  }, [user, setValue]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    customerApi
      .addresses()
      .then((res) => {
        if (!cancelled) setSavedAddresses((res.data || []).filter((a) => a.id));
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function applySavedAddress(addressId: string) {
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (!addr) return;
    setValue("name", addr.fullName, { shouldValidate: true });
    setValue("phone", addr.phone, { shouldValidate: true });
    setValue("ward", addr.ward, { shouldValidate: true });
    setValue("address", addr.addressLine1, { shouldValidate: true });
    const normalizedProvince = addr.province.replace(/\s+Province$/i, "").trim();
    const province = PROVINCES.find((p) => p === normalizedProvince);
    if (province) {
      const districts = getDistrictsForProvince(province);
      setValue("province", province, { shouldValidate: true });
      const district = districts.find((d) => d === addr.district) || districts[0];
      setValue("district", district, { shouldValidate: true });
      const cities = getMunicipalitiesForDistrict(district as District).map((m) => m.name);
      setValue("city", cities.find((c) => c === addr.city) || cities[0] || "", { shouldValidate: true });
    }
  }

  const form = watch();
  const subtotal = getSubtotal();
  const deliveryRule = getDeliveryRule(form.district, form.province);
  const deliveryFee = calculateDeliveryFee(
    subtotal,
    form.district,
    form.province,
  );
  const giftWrapFee = form.giftWrap ? 100 : 0;
  const isCOD = form.payment === "Cash on Delivery";
  const codFee = isCOD ? COD_FEE : 0;
  const total = subtotal + deliveryFee + giftWrapFee + codFee;
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
    "w-full rounded-[1rem] border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 md:rounded-[1.15rem] md:py-3 md:text-sm";
  const labelClass =
    "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 md:mb-2";
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

  function stepButton(step: number) {
    return currentStep === step
      ? "bg-neutral-950 text-white"
      : currentStep > step
        ? "bg-primary text-white"
        : "bg-white text-neutral-400";
  }

  async function onSubmit(data: CheckoutFormData) {
    setIsSubmitting(true);
    setSubmitError(null);
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
          orderNumber: `GLM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
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
            email: data.email,
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
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof GlamoApiError && err.status === 401) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }
      const checkoutError = useCheckoutStore.getState().error || getUserMessage(err);
      setSubmitError(checkoutError);
      toast.error(checkoutError);
      return;
    }

    const paymentCode = paymentCodeMap[data.payment] || "cod";

    if (paymentCode === "khalti" && order.id) {
      try {
        const khaltiResult = await initiateKhaltiPayment(order.id);
        if (khaltiResult.data?.paymentUrl) {
          clearCart();
          window.location.href = khaltiResult.data.paymentUrl;
          return;
        }
      } catch { /* fall through to confirmation page */ }
    }

    if (paymentCode === "esewa" && order.id) {
      try {
        const esewaResult = await initiateEsewaPayment(order.id);
        if (esewaResult.data?.url && esewaResult.data?.payload) {
          clearCart();
          const form = document.createElement("form");
          form.method = "POST";
          form.action = esewaResult.data.url;
          for (const [key, value] of Object.entries(esewaResult.data.payload)) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value;
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          return;
        }
      } catch { /* fall through to confirmation page */ }
    }

    router.push(`/order-confirmation/${order.orderNumber}`);
    setTimeout(() => {
      clearCart();
    }, 100);
  }

  if (authLoading || user === null) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-brand-bgLight px-4 py-12">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Verifying your session" />
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="bg-brand-bgLight px-4 py-12 pb-24 md:px-6 md:py-16 md:pb-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-surfacePink text-primary">
            <ShoppingBag size={30} />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-5xl">
            Your bag is empty
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-500">
            Add items before checking out.
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

  return (
    <main className="bg-brand-bgLight px-4 py-6 pb-24 md:px-6 md:py-12 md:pb-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-500 md:mb-6" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link href="/cart" className="transition hover:text-primary">
            Cart
          </Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="font-medium text-neutral-950">Checkout</span>
        </nav>
        <div className="mb-6 rounded-[2rem] bg-brand-surfacePink px-4 py-5 md:mb-8 md:rounded-[2.5rem] md:px-8 md:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Secure checkout
          </p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-7xl">
              Confirm your beauty bag.
            </h1>
            <p className="max-w-sm text-sm leading-7 text-neutral-600">
              Delivery rules are Nepal-aware. Digital payments stay marked
              coming soon until the gateway is ready.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:items-start">
          <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_70px_-56px_rgba(26,21,18,0.55)] md:rounded-[2.25rem] md:p-7">
            <div className="mb-6 flex items-center justify-between gap-2 md:mb-8">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = currentStep === i;
                const isCompleted = i < currentStep;
                return (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => setCurrentStep(i)}
                    className="flex flex-col items-center gap-1.5"
                    aria-current={isActive ? "step" : undefined}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition md:h-10 md:w-10 ${stepButton(i)}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Icon size={17} />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.08em] md:text-xs md:tracking-[0.12em] ${isActive || isCompleted ? "text-neutral-950" : "text-neutral-400"}`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {currentStep === 0 && (
                <div className="space-y-4 md:space-y-5">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
                    Contact & shipping
                  </h2>
                  {savedAddresses.length > 0 && (
                    <div>
                      <label htmlFor="savedAddress" className={labelClass}>
                        Use a saved address
                      </label>
                      <select
                        id="savedAddress"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) applySavedAddress(e.target.value);
                        }}
                        className={inputClass}
                      >
                        <option value="">Enter a new address</option>
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id ?? ""}>
                            {addr.fullName} — {addr.addressLine1}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Full name
                      </label>
                      <input
                        id="name"
                        {...register("name")}
                        className={inputClass}
                        placeholder="Your full name"
                        autoComplete="name"
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
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <p className={errorClass}>{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={inputClass}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className={errorClass}>{errors.email.message}</p>
                    )}
                    <p className="mt-1 text-[11px] text-neutral-500">For order confirmation and delivery updates.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 md:gap-5">
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
                  <div className="grid gap-4 md:grid-cols-2 md:gap-5">
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
                        autoComplete="address-line2"
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
                      autoComplete="street-address"
                    />
                    {errors.address && (
                      <p className={errorClass}>{errors.address.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const valid = await trigger(["name", "phone", "province", "district", "city", "ward", "address"]);
                      if (valid) setCurrentStep(1);
                    }}
                    className="w-full rounded-full bg-neutral-950 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-neutral-300 md:w-auto"
                  >
                    Continue to delivery
                  </button>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4 md:space-y-5">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
                    Delivery method
                  </h2>
                  <label className="flex cursor-pointer items-center gap-4 rounded-[1.25rem] border border-primary bg-brand-bgLight p-4 md:rounded-[1.5rem] md:p-5">
                    <input
                      type="radio"
                      name="delivery"
                      defaultChecked
                      className="accent-primary"
                    />
                    <Truck className="text-primary" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-950">
                        Standard delivery
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {deliveryRule.estimate}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-950">
                      {deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}
                    </span>
                  </label>
                  <CodAvailabilityChecker
                    district={form.district}
                    province={form.province}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="rounded-full border border-neutral-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700 hover:border-neutral-400"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="rounded-full bg-neutral-950 px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-primary"
                    >
                      Continue to payment
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 md:space-y-5">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
                    Payment method
                  </h2>
                  <div className="grid gap-3">
                    {paymentMethods.map((method) => {
                      const isComingSoon = comingSoonMethods.has(method);
                      return (
                        <label
                          key={method}
                          className={`flex cursor-pointer items-center gap-4 rounded-[1.25rem] border p-4 transition md:rounded-[1.5rem] md:p-5 ${form.payment === method ? "border-primary bg-brand-bgLight" : "border-neutral-200 hover:border-neutral-400"} ${isComingSoon ? "opacity-55" : ""}`}
                        >
                          <input
                            type="radio"
                            {...register("payment")}
                            value={method}
                            disabled={isComingSoon}
                            className="accent-primary"
                          />
                          <CreditCard size={19} className="text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-neutral-950">
                              {method}
                            </p>
                            {isComingSoon && (
                              <p className="mt-1 text-xs text-neutral-500">
                                Coming soon
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <label className="flex items-center gap-3 rounded-[1.25rem] border border-neutral-200 p-4 text-sm text-neutral-700 md:rounded-[1.5rem] md:p-5">
                    <input
                      type="checkbox"
                      {...register("giftWrap")}
                      className="accent-primary"
                    />
                    <Gift size={18} className="text-primary" /> Add gift wrap
                    for {formatNPR(100)}
                  </label>
                  <div>
                    <label htmlFor="notes" className={labelClass}>
                      Order notes
                    </label>
                    <textarea
                      id="notes"
                      {...register("notes")}
                      className={`${inputClass} min-h-24 md:min-h-28`}
                      placeholder="Delivery note, gift message or preferred call time"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="rounded-full border border-neutral-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700 hover:border-neutral-400"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const valid = await trigger(["payment"]);
                        if (valid) setCurrentStep(3);
                      }}
                      className="rounded-full bg-neutral-950 px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-primary"
                    >
                      Review order
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 md:space-y-5">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
                    Review order
                  </h2>
                  <div className="divide-y divide-neutral-200 rounded-[1.25rem] border border-neutral-200 md:rounded-[1.5rem]">
                    {items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.selectedShade || "base"}`}
                        className="flex gap-3 p-3 md:gap-4 md:p-4"
                      >
                        <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[0.75rem] bg-neutral-100 md:h-20 md:w-16 md:rounded-[1rem]">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 56px, 64px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                            {item.product.brand}
                          </p>
                          <p className="truncate text-sm font-semibold text-neutral-950">
                            {item.product.name}
                          </p>
                          {item.selectedShade && (
                            <p className="text-xs text-neutral-500">
                              Shade: {item.selectedShade}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-neutral-950">
                            {formatNPR(item.product.price * item.quantity)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Qty {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[1.25rem] border border-neutral-200 bg-brand-bgLight p-4 md:rounded-[1.5rem] md:p-5">
                    <OrderSummary
                      subtotal={subtotal}
                      deliveryFee={deliveryFee}
                      giftWrapFee={giftWrapFee}
                      codFee={codFee}
                      total={total}
                    />
                  </div>
                  <div className="rounded-[1.25rem] border border-neutral-200 p-4 text-sm leading-7 text-neutral-600 md:rounded-[1.5rem] md:p-5">
                    <p className="font-semibold text-neutral-950">
                      Shipping to
                    </p>
                    <p>{form.name}</p>
                    <p>
                      {form.address}, Ward {form.ward}, {form.city},{" "}
                      {form.district}, {form.province}
                    </p>
                    <p>{form.phone}</p>
                    <p className="mt-2 font-semibold text-neutral-950">
                      Payment: {form.payment}
                    </p>
                  </div>
                  {submitError && (
                    <div role="alert" className="flex items-start justify-between gap-3 rounded-[1rem] border border-error/30 bg-error/5 px-4 py-3 md:rounded-[1.25rem]">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-error">{submitError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitError(null);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-error underline-offset-4 hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSubmitError(null)}
                        className="shrink-0 text-error/70 transition hover:text-error"
                        aria-label="Dismiss error"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="rounded-full border border-neutral-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700 hover:border-neutral-400"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="flex-1 rounded-full bg-neutral-950 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                      {isSubmitting ? "Placing order..." : "Place order"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </section>

          <aside className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-editorial md:rounded-[2.25rem] md:p-6 lg:sticky lg:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Bag summary
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-950 md:text-4xl">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </h2>
            <div className="mt-4 max-h-[280px] space-y-2.5 overflow-auto pr-1 md:mt-5 md:max-h-[360px] md:space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedShade || "base"}-summary`}
                  className="flex gap-3 rounded-[1rem] bg-brand-bgLight p-2.5 md:rounded-[1.25rem] md:p-3"
                >
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-[0.75rem] bg-neutral-100 md:h-16 md:w-14 md:rounded-[1rem]">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 48px, 56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Qty {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-neutral-200 pt-4 md:mt-6 md:pt-5">
              <OrderSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                giftWrapFee={giftWrapFee}
                codFee={codFee}
                total={total}
              />
            </div>
            <div className="mt-4 flex gap-3 rounded-[1rem] bg-neutral-950 p-3.5 text-white md:rounded-[1.25rem] md:p-4">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-brand-accentLight" />
              <p className="text-xs leading-5 text-white/75">
                Secure checkout. Your details are encrypted and never shared.
              </p>
            </div>
            <div className="mt-3 space-y-2 text-xs leading-5 text-neutral-500">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="shrink-0 text-primary" />
                <span>Authentic products, verified before dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} className="shrink-0 text-primary" />
                <span>Free delivery on orders over {formatNPR(FREE_DELIVERY_THRESHOLD)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift size={14} className="shrink-0 text-primary" />
                <span>Gift wrap available at checkout</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
