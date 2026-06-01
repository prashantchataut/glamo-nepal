"use client";

import { SITE_CONFIG } from "@/lib/config";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { Store, MapPin, Smartphone, CreditCard, Truck, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

function SettingItem({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number | string; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-bgLight p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 text-brand-primary" size={16} />
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">{label}</p>
          <p className="mt-1 text-sm font-medium text-brand-textPrimary">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsView() {
  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold">Store settings</h2>
      <p className="mt-0.5 text-sm text-brand-textMuted">Business constants for GLAMO NEPAL.</p>
      <div className="mt-5 grid gap-3 grid-cols-2">
        <SettingItem icon={Store} label="Store" value={SITE_CONFIG.fullTitle} />
        <SettingItem icon={MapPin} label="Address" value={SITE_CONFIG.address} />
        <SettingItem icon={Smartphone} label="Phone" value={SITE_CONFIG.phone} />
        <SettingItem icon={CreditCard} label="Payments" value={SITE_CONFIG.paymentMethods.join(", ")} />
        <SettingItem icon={Truck} label="Free shipping" value={`रू ${FREE_DELIVERY_THRESHOLD.toLocaleString()}`} />
        <SettingItem icon={ShieldCheck} label="Instagram" value={`${SITE_CONFIG.instagramHandle} · ${SITE_CONFIG.social.instagram}`} />
      </div>
    </section>
  );
}