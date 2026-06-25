"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShoppingBag, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useCheckoutForm, clearCheckoutDraft } from "@/hooks/useCheckoutForm";
import { customerApi } from "@/lib/api/customer";
import { GlamoApiError } from "@/lib/api/client";
import { getUserMessage } from "@/lib/api/error-handler";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { calculateDeliveryFee, calculateCodFee, getDeliveryRule } from "@/lib/delivery";
import { initiateKhaltiPayment, initiateEsewaPayment } from "@/lib/api/checkout";
import type { Address, PaymentMethodCode } from "@/lib/api/contracts";
import { PROVINCES, getDistrictsForProvince, getMunicipalitiesForDistrict, type District } from "@/lib/nepal-locations";
import { ShippingStep } from "./steps/ShippingStep";
import { DeliveryStep } from "./steps/DeliveryStep";
import { PaymentStep } from "./steps/PaymentStep";
import { ReviewStep } from "./steps/ReviewStep";
import { OrderSummarySidebar } from "./OrderSummarySidebar";
import { CheckoutStepper } from "./CheckoutStepper";

const paymentCodeMap: Record<string, PaymentMethodCode> = {
  "Cash on Delivery": "cod",
  Khalti: "khalti",
  eSewa: "esewa",
  Cards: "card",
};

export function CheckoutPageClient() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { placeOrder, couponCode, discountAmount, couponError, couponLoading, applyCoupon, removeCoupon } = useCheckoutStore();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);

  const { form: formMethods } = useCheckoutForm();
  const { handleSubmit, setValue, watch, formState: { isValid } } = formMethods;

  useEffect(() => {
    if (guestMode && formHeadingRef.current) {
      formHeadingRef.current.focus();
    }
  }, [guestMode]);

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
      .then((res) => { if (!cancelled) setSavedAddresses((res.data || []).filter((a) => a.id)); })
      .catch(() => { if (!cancelled) setSavedAddresses([]); });
    return () => { cancelled = true; };
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

  const watched = watch();
  const subtotal = getSubtotal();
  const deliveryFee = calculateDeliveryFee(subtotal, watched.district, watched.province);
  const giftWrapFee = watched.giftWrap ? 100 : 0;
  const isCOD = watched.payment === "Cash on Delivery";
  const codFee = isCOD ? calculateCodFee(subtotal) : 0;
  const total = subtotal + deliveryFee + giftWrapFee + codFee - discountAmount;
  const deliveryRule = getDeliveryRule(watched.district, watched.province);

  const canSubmit = Boolean(
    isValid &&
    items.length > 0,
  );

  function goToStep(step: number) {
    if (step <= currentStep || completedSteps.has(step - 1) || step === 0) {
      setCurrentStep(step);
    }
  }

  function advanceStep(from: number) {
    setCompletedSteps((prev) => new Set(prev).add(from));
    setCurrentStep(from + 1);
  }

  async function onSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    const data = watched;
    const shippingAddress = `${data.address}, Ward ${data.ward}, ${data.city}, ${data.district}, ${data.province}, Nepal`;
    trackEvent("order_placed", { value: total, method: data.payment, district: data.district, province: data.province, deliveryFee, giftWrap: data.giftWrap });

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
            name: item.product.name, brand: item.product.brand, image: item.product.image,
            price: item.product.price, quantity: item.quantity, selectedShade: item.selectedShade,
          })),
        },
        {
          customer: { name: data.name, email: data.email, phone: data.phone },
          shippingAddress: { fullName: data.name, phone: data.phone, province: data.province, district: data.district, city: data.city, ward: data.ward, addressLine1: data.address },
          items: items.map((item) => ({
            productId: item.product.id, name: item.product.name, price: item.product.price,
            quantity: item.quantity, selectedShade: item.selectedShade, image: item.product.image, brand: item.product.brand,
          })),
          paymentMethod: paymentCodeMap[data.payment] || "cod",
          giftWrap: data.giftWrap,
          orderNotes: data.notes,
          couponCode: couponCode || undefined,
          deliveryFee,
          subtotal,
          grandTotal: total,
          currency: "NPR" as const,
        },
      );
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof GlamoApiError && err.status === 401 && user) {
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
          clearCheckoutDraft();
          window.location.href = khaltiResult.data.paymentUrl;
          return;
        }
        setSubmitError("Khalti payment could not be initiated. Your order has been placed - please pay from your order details.");
        setIsSubmitting(false);
        return;
      } catch (err) {
        setSubmitError(getUserMessage(err) || "Khalti payment failed. Your order has been placed - please pay from your order details.");
        setIsSubmitting(false);
        return;
      }
    }

    if (paymentCode === "esewa" && order.id) {
      try {
        const esewaResult = await initiateEsewaPayment(order.id);
        if (esewaResult.data?.url && esewaResult.data?.payload) {
          clearCart();
          clearCheckoutDraft();
          const form = document.createElement("form");
          form.method = "POST";
          form.action = String(esewaResult.data.url);
          const allowedKeys = new Set(["amt", "pid", "scd", "suUrl", "fuUrl", "tAmt", "txAmt", "pAmt", "sAmt", "taxAmt"]);
          for (const [key, value] of Object.entries(esewaResult.data.payload)) {
            if (!allowedKeys.has(key)) continue;
            if (typeof key !== "string" || (typeof value !== "string" && typeof value !== "number")) continue;
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
          }
          document.body.appendChild(form);
          form.submit();
          form.remove();
          return;
        }
        setSubmitError("eSewa payment could not be initiated. Your order has been placed - please pay from your order details.");
        setIsSubmitting(false);
        return;
      } catch (err) {
        setSubmitError(getUserMessage(err) || "eSewa payment failed. Your order has been placed - please pay from your order details.");
        setIsSubmitting(false);
        return;
      }
    }

    clearCart();
    clearCheckoutDraft();
    router.push(`/order-confirmation/${order.orderNumber}`);
  }

  const showAuthChoice = !authLoading && user === null && !guestMode;

  if (authLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-neutral-50 px-4 py-12">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Verifying your session" />
      </main>
    );
  }

  if (showAuthChoice) {
    return (
      <main className="bg-neutral-50 px-4 py-12 pb-24 md:px-6 md:py-16 md:pb-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-primary">
            <LockKeyhole size={28} />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-5xl">
            Almost there
          </h1>
          <p className="mt-4 text-sm leading-7 text-neutral-500">
            Log in to track your order and earn rewards, or continue as a guest.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent("/checkout")}`}
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-primary"
            >
              Log in
            </Link>
            <button
              type="button"
              onClick={() => setGuestMode(true)}
              className="flex min-h-12 w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-8 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:border-neutral-400"
            >
              Continue as guest
            </button>
          </div>
          <p className="mt-6 text-xs leading-5 text-neutral-500">
            You&apos;ll still enter your name, phone, and delivery address.
          </p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="bg-neutral-50 px-4 py-12 pb-24 md:px-6 md:py-16 md:pb-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-primary">
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
    <main className="bg-neutral-50 px-4 py-6 pb-24 md:px-6 md:py-12 md:pb-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-500 md:mb-6" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-primary">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link href="/cart" className="transition hover:text-primary">Cart</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="font-medium text-neutral-950">Checkout</span>
        </nav>

        <div className="mb-6 rounded-[2rem] bg-rose-50 px-4 py-5 md:mb-8 md:rounded-[2rem] md:px-8 md:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-text">Secure checkout</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-7xl">
              Confirm your beauty bag.
            </h1>
            <p className="max-w-sm text-sm leading-7 text-neutral-600">
              Delivery within Kathmandu Valley. Cash on delivery available.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:items-start">
          <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-card-prominent md:rounded-[2.25rem] md:p-7">
            <CheckoutStepper currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} />

            <form onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting}>
              {currentStep === 0 && (
                <ShippingStep
                  form={formMethods}
                  savedAddresses={savedAddresses}
                  onApplySavedAddress={applySavedAddress}
                  onContinue={() => advanceStep(0)}
                  headingRef={formHeadingRef}
                />
              )}
              {currentStep === 1 && (
                <DeliveryStep
                  district={watched.district}
                  province={watched.province}
                  subtotal={subtotal}
                  onBack={() => setCurrentStep(0)}
                  onContinue={() => advanceStep(1)}
                />
              )}
              {currentStep === 2 && (
                <PaymentStep
                  form={formMethods}
                  onBack={() => setCurrentStep(1)}
                  onContinue={() => advanceStep(2)}
                />
              )}
              {currentStep === 3 && (
                <ReviewStep
                  form={watched}
                  items={items}
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  giftWrapFee={giftWrapFee}
                  codFee={codFee}
                  discountAmount={discountAmount}
                  total={total}
                  isSubmitting={isSubmitting}
                  canSubmit={canSubmit}
                  submitError={submitError}
                  onBack={() => setCurrentStep(2)}
                  onSubmit={onSubmit}
                  onDismissError={() => setSubmitError(null)}
                />
              )}
            </form>
          </section>

          <OrderSummarySidebar
            items={items}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            giftWrapFee={giftWrapFee}
            codFee={codFee}
            discountAmount={discountAmount}
            total={total}
            couponCode={couponCode}
            couponError={couponError}
            couponLoading={couponLoading}
            couponInput={couponInput}
            onCouponInputChange={(v) => { setCouponInput(v); if (couponError) useCheckoutStore.setState({ couponError: null }); }}
            onApplyCoupon={() => { if (couponInput.trim()) applyCoupon(couponInput.trim(), subtotal); }}
            onRemoveCoupon={() => { removeCoupon(); setCouponInput(""); }}
          />
        </div>
      </div>
    </main>
  );
}