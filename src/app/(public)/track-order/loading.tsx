export default function TrackOrderLoading() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-8 w-48 animate-pulse rounded bg-white/20" />
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-14 animate-pulse rounded-full bg-neutral-100" />
          <div className="mt-8 animate-pulse rounded-[1.5rem] bg-neutral-100 p-8">
            <div className="space-y-4">
              <div className="h-4 w-1/3 rounded bg-neutral-200" />
              <div className="h-6 w-2/3 rounded bg-neutral-200" />
              <div className="h-4 w-1/4 rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}