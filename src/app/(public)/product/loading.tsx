export default function ProductLoading() {
  return (
    <main className="bg-neutral-50">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-[2rem] bg-neutral-50" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-50" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-neutral-50" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-neutral-50" />
            <div className="h-20 w-full animate-pulse rounded bg-neutral-50" />
          </div>
        </div>
      </div>
    </main>
  );
}