import type { LucideIcon } from "lucide-react";

export function StatusCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
        <Icon size={20} strokeWidth={1.6} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-textMuted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-brand-textPrimary">{value}</p>
      {note ? <p className="mt-2 text-sm text-brand-textMuted">{note}</p> : null}
    </div>
  );
}
