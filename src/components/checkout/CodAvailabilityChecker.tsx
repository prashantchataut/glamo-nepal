"use client";

import { CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";
import { getDeliveryRule, isCodAvailable } from "@/lib/delivery";
import { cn, formatNpr } from "@/lib/utils";

export function getCodRule(district: string, province?: string) {
  const rule = getDeliveryRule(district, province);
  return { available: rule.codAvailable, estimate: rule.estimate, fee: rule.fee };
}

export function CodAvailabilityChecker({ district, province }: { district: string; province?: string }) {
  const rule = getDeliveryRule(district, province);
  const codAvailable = district ? isCodAvailable(district as never, province as never) : false;
  if (!district) {
    return <div className="rounded-2xl border border-dashed border-brand-secondary/40 bg-brand-bgLight p-4 text-sm text-brand-textMuted">Choose a district to check Cash on Delivery availability.</div>;
  }
  return (
    <div className={cn("rounded-2xl border p-4", codAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
      <div className="flex items-start gap-3">
        {codAvailable ? <CheckCircle2 className="mt-0.5" size={20} /> : <XCircle className="mt-0.5" size={20} />}
        <div>
          <p className="font-semibold">{codAvailable ? "COD available" : "Prepaid checkout recommended"} in {district}</p>
          <p className="mt-1 flex items-center gap-1 text-sm opacity-80"><Clock size={14} /> Estimated delivery: {rule.estimate}</p>
          <p className="mt-1 flex items-center gap-1 text-sm opacity-80"><MapPin size={14} /> Delivery fee before threshold: {formatNpr(rule.fee)}</p>
        </div>
      </div>
    </div>
  );
}