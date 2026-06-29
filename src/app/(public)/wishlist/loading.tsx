export default function WishlistLoading() {
  return (
    <main className="bg-neutral-50 section-padding page-padding">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-4 mb-10">
          <div className="h-8 w-48 rounded skeleton-shimmer" />
          <div className="h-4 w-64 rounded skeleton-shimmer" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[1.5rem] border border-neutral-200 overflow-hidden">
              <div className="aspect-[4/5] skeleton-shimmer" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-16 rounded skeleton-shimmer" />
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                <div className="h-5 w-20 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}