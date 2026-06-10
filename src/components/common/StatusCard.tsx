

export function StatusCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="font-label mt-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-neutral-900">{value}</p>
      {note ? <p className="mt-2 text-sm text-neutral-500">{note}</p> : null}
    </div>
  );
}
