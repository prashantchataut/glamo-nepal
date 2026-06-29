"use client";

import type { ComponentType } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}

export function StatCard({ label, value, note, icon: Icon }: StatCardProps) {
  return (
    <div className="card-hover rounded-[1.5rem] border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={18} />
        </div>
        <span className="rounded-full bg-brand-bgLight px-2.5 py-0.5 text-xs font-semibold text-brand-textMuted">
          Live
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}
