"use client";

import { type UseFormReturn } from "react-hook-form";
import { Gift } from "lucide-react";
import type { CheckoutFormData } from "@/lib/validations/checkout";
import { formatNPR } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 md:rounded-[1.5rem] md:py-3 md:text-sm";
const labelClass =
  "mb-1.5 block text-sm font-medium text-neutral-700 md:mb-2";

const paymentMethods = ["Cash on Delivery", "Khalti", "eSewa"] as const;

const hasKhaltiKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_KHALTI_PUBLIC_KEY;
const hasEsewaKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_ESEWA_MERCHANT_ID;
const comingSoonMethods = new Set<string>([
  ...(!hasKhaltiKey ? ["Khalti"] : []),
  ...(!hasEsewaKey ? ["eSewa"] : []),
  "Cards",
]);

interface PaymentStepProps {
  form: UseFormReturn<CheckoutFormData>;
  onBack: () => void;
  onContinue: () => void;
}

export function PaymentStep({ form, onBack, onContinue }: PaymentStepProps) {
  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const selectedPayment = watch("payment");

  return (
    <div className="space-y-4 md:space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
        Payment method
      </h2>

      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const isComingSoon = comingSoonMethods.has(method);
          const isSelected = selectedPayment === method;
          return (
            <label
              key={method}
              className={`flex cursor-pointer items-center gap-4 rounded-[1.5rem] border p-4 transition md:rounded-[1.5rem] md:p-5 ${isSelected ? "border-primary bg-neutral-50" : "border-neutral-200 hover:border-neutral-400"} ${isComingSoon ? "opacity-55" : ""}`}
            >
              <input
                type="radio"
                {...register("payment")}
                value={method}
                disabled={isComingSoon}
                className="h-5 w-5 cursor-pointer rounded-full border-2 border-neutral-300 text-primary accent-primary focus:ring-2 focus:ring-primary/20"
              />
              <PaymentIcon method={method} selected={isSelected} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-950">{method}</p>
                {isComingSoon && <p className="mt-1 text-xs text-neutral-500">Coming soon</p>}
                {method === "Cash on Delivery" && !isComingSoon && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Pay when your order arrives · 3% service fee applies
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

      <label className="flex items-center gap-3 rounded-[1.5rem] border border-neutral-200 p-4 text-sm text-neutral-700 md:rounded-[1.5rem] md:p-5">
        <input
          type="checkbox"
          {...register("giftWrap")}
          className="h-5 w-5 cursor-pointer rounded-full border-2 border-neutral-300 text-primary accent-primary focus:ring-2 focus:ring-primary/20"
        />
        <Gift size={18} className="text-primary" /> Add gift wrap for {formatNPR(100)}
      </label>

      <div>
        <label htmlFor="notes" className={labelClass}>Order notes</label>
        <textarea
          id="notes"
          {...register("notes")}
          className={`${inputClass} min-h-24 md:min-h-28`}
          placeholder="Delivery note, gift message or preferred call time"
        />
        {errors.notes && <p className="mt-1 text-xs text-error" role="alert">{errors.notes.message}</p>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 hover:border-neutral-400"
        >
          Back
        </button>
        <button
          type="button"
          onClick={async () => {
            const valid = await trigger(["payment"]);
            if (valid) onContinue();
          }}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-neutral-50 hover:bg-primary"
        >
          Review order
        </button>
      </div>
    </div>
  );
}

function PaymentIcon({ method, selected }: { method: string; selected: boolean }) {
  const colorClass = selected ? "text-primary" : "text-neutral-400";
  switch (method) {
    case "Cash on Delivery":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={colorClass}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );
    case "Khalti":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className={colorClass}>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.15" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="system-ui">K</text>
        </svg>
      );
    case "eSewa":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className={colorClass}>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.15" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fontFamily="system-ui">eS</text>
        </svg>
      );
    default:
      return null;
  }
}