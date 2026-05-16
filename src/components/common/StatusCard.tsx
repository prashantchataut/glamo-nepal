

export function StatusCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-cream-50 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
        {icon}
      </div>
      <p className="font-label mt-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-brand-textPrimary">{value}</p>
      {note ? <p className="mt-2 text-sm text-brand-textMuted">{note}</p> : null}
    </div>
  );
}
