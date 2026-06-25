"use client";

import { Clock, MapPin, Truck } from "lucide-react";
import { getDeliveryRule } from "@/lib/delivery";
import { cn, formatNPR } from "@/lib/utils";

/**
 * Delivery info shown on the checkout delivery step.
 *
 * COD is now globally available at 3% of cart subtotal - it's the default
 * payment method and doesn't need to be advertised on every page. The 3% fee
 * is only revealed in the order summary after the customer selects COD as
 * their payment method. This component focuses on delivery ETA and fee only.
 */
export function getCodRule(district: string, province?: string) {
  const rule = getDeliveryRule(district, province);
  return { available: true, estimate: rule.estimate, fee: rule.fee };
}

export function CodAvailabilityChecker({ district, province, subtotal = 0 }: { district: string; province?: string; subtotal?: number }) {
  const rule = getDeliveryRule(district, province);

  if (!district) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
        Choose a district to see delivery options.
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900")}>
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 shrink-0 text-primary" size={20} />
        <div className="space-y-1.5">
          <p className="font-semibold text-neutral-950">Delivery to {district}</p>
          <p className="flex items-center gap-1.5 text-sm text-neutral-600">
            <Clock size={14} /> Estimated delivery: {rule.estimate}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-neutral-600">
            <MapPin size={14} /> Delivery fee: {rule.fee > 0 ? formatNPR(rule.fee) : "Free"}
          </p>
        </div>
      </div>
    </div>
  );
}
