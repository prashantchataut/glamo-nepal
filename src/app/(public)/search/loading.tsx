export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-8 w-48 animate-pulse rounded bg-white/20" />
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="h-12 w-full animate-pulse rounded-full bg-neutral-100" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[1.5rem] bg-neutral-100">
              <div className="aspect-square rounded-t-[2rem]" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-200" />
                <div className="h-3 w-1/2 rounded bg-neutral-200" />
                <div className="h-5 w-1/3 rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}