"use client";

import { CalendarDays, Gift, PackagePlus, Truck } from "lucide-react";
import { CouponsView } from "@/components/admin/coupons/CouponListView";

const playbooks = [
  { title: "Gift with purchase", note: "Create the coupon here, then attach the gift SKU in order notes until bundle rules are added.", icon: Gift },
  { title: "Routine bundles", note: "Use Products to publish kit SKUs for cleanser + serum + moisturiser + SPF.", icon: PackagePlus },
  { title: "Free shipping threshold", note: "Edit delivery settings from Settings. Avoid hidden checkout surprises.", icon: Truck },
  { title: "Campaign calendar", note: "Plan launch windows here; homepage banners live in Content.", icon: CalendarDays },
];

export function PromotionsView() {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-textPrimary">Promotions</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Discounts, gifts and beauty launch planning</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">
              Keep the working discount-code CRUD here and add operational guardrails for gift-with-purchase, bundles and campaign windows.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {playbooks.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border border-brand-border bg-brand-bgLight p-4">
                <Icon size={18} className="text-brand-primary" />
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-brand-textMuted">{item.note}</p>
              </article>
            );
          })}
        </div>
      </section>
      <CouponsView />
    </div>
  );
}
