export default function BlogLoading() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="h-4 w-32 animate-pulse rounded bg-brand-bgLight mx-auto" />
          <div className="mt-3 h-12 w-96 animate-pulse rounded bg-brand-bgLight mx-auto" />
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-border/30 bg-white overflow-hidden">
              <div className="aspect-[3/2] animate-pulse bg-brand-bgLight" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-20 animate-pulse rounded bg-brand-bgLight" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-brand-bgLight" />
                <div className="h-3 w-full animate-pulse rounded bg-brand-bgLight" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}