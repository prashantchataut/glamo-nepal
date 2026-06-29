"use client";

import { Truck } from "lucide-react";
import { CodAvailabilityChecker } from "@/components/checkout/CodAvailabilityChecker";
import { getDeliveryRule, calculateDeliveryFee } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";

interface DeliveryStepProps {
  district: string;
  province: string;
  subtotal: number;
  onBack: () => void;
  onContinue: () => void;
}

export function DeliveryStep({ district, province, subtotal, onBack, onContinue }: DeliveryStepProps) {
  const deliveryRule = getDeliveryRule(district, province);
  const deliveryFee = calculateDeliveryFee(subtotal, district, province);

  return (
    <div className="space-y-4 md:space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
        Delivery method
      </h2>

      {deliveryRule.serviceLevel === "pending" ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 md:rounded-[1.5rem] md:p-5">
          <p className="font-semibold">Outside delivery area</p>
          <p className="mt-1 text-amber-800">We currently deliver within Kathmandu Valley only. Outside-Valley delivery will be available soon.</p>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-4 rounded-[1.5rem] border border-primary bg-neutral-50 p-4 md:rounded-[1.5rem] md:p-5">
          <input
            type="radio"
            name="delivery"
            defaultChecked
            className="h-5 w-5 cursor-pointer rounded-full border-2 border-neutral-300 text-primary accent-primary focus:ring-2 focus:ring-primary/20"
          />
          <Truck className="text-primary" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-950">Standard delivery</p>
            <p className="mt-1 text-xs text-neutral-500">{deliveryRule.estimate}</p>
          </div>
          <span className="text-sm font-semibold text-neutral-950">
            {deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}
          </span>
        </label>
      )}

      <CodAvailabilityChecker district={district} province={province} />

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
          onClick={onContinue}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-neutral-950 px-8 py-3 text-sm font-semibold text-neutral-50 hover:bg-primary"
        >
          Continue to payment
        </button>
      </div>
    </div>
  );
}