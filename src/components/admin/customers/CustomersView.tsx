"use client";

import { Users, Mail, MapPin } from "lucide-react";
import type { ComponentType } from "react";

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: ComponentType<{ size?: number | string; className?: string }> }) {
  return (
    <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={18} />
        </div>
        <span className="font-label rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">Live</span>
      </div>
      <p className="mt-4 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}

export function CustomersView() {
  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-semibold">Customers</h2>
      <p className="mt-0.5 text-sm text-brand-textMuted">Customer records will connect to the live user and order APIs. The panel is ready for saved addresses, order value and contact preferences.</p>
      <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-3">
        <StatCard icon={Users} label="Total customers" value="26" note="Seeded admin count" />
        <StatCard icon={Mail} label="Newsletter leads" value="14" note="Waiting for email provider" />
        <StatCard icon={MapPin} label="Kathmandu area" value="18" note="Primary delivery cluster" />
      </div>
    </section>
  );
}