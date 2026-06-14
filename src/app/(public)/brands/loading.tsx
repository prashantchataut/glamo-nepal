export default function BrandLoading() {
  return (
    <main className="bg-neutral-50 section-padding page-padding">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded skeleton-shimmer" />
          <div className="h-4 w-64 rounded skeleton-shimmer" />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-[1.5rem] skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}