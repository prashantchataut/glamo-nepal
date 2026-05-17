export function RouteLoading({ label = "Curating GLAMO beauty picks" }: { label?: string }) {
  return (
    <main className="min-h-[60vh] bg-brand-bgLight py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand-secondary/30 border-t-brand-primary animate-spin" />
          <p className="font-label mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Loading</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-brand-textPrimary">{label}</h1>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl skeleton-shimmer" />)}
          </div>
        </div>
      </div>
    </main>
  );
}