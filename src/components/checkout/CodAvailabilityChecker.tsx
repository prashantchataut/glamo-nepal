"use client";

import { CheckCircle2, Clock, MapPin } from "lucide-react";
import { calculateCodFee, getDeliveryRule } from "@/lib/delivery";
import { cn, formatNPR } from "@/lib/utils";

/**
 * Legacy helper retained for callers that only need the delivery rule + COD
 * availability flag. COD is now universally available at 3% globally.
 */
export function getCodRule(district: string, province?: string) {
  const rule = getDeliveryRule(district, province);
  return { available: true, estimate: rule.estimate, fee: rule.fee };
}

export function CodAvailabilityChecker({ district, province, subtotal = 0 }: { district: string; province?: string; subtotal?: number }) {
  const rule = getDeliveryRule(district, province);
  const codFee = calculateCodFee(subtotal);

  if (!district) {
    return <div className="rounded-2xl border border-dashed border-brand-secondary/40 bg-neutral-50 p-4 text-sm text-neutral-500">Choose a district to check delivery availability.</div>;
  }

  return (
    <div className={cn("rounded-2xl border p-4", "border-emerald-200 bg-emerald-50 text-emerald-900")}>
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
        <div className="space-y-1">
          <p className="font-semibold">Cash on Delivery available in {district}</p>
          <p className="flex items-center gap-1 text-sm opacity-80">
            <Clock size={14} /> Estimated delivery: {rule.estimate}
          </p>
          <p className="flex items-center gap-1 text-sm opacity-80">
            <MapPin size={14} /> Delivery fee: {formatNPR(rule.fee)}
          </p>
          <p className="text-sm opacity-80">
            COD handling fee: <strong>{formatNPR(codFee)}</strong> (3% of cart subtotal)
          </p>
        </div>
      </div>
    </div>
  );
}
