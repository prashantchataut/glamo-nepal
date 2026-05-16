export default function ShopLoading() {
  return (
    <main className="bg-brand-bgLight py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-brand-bgLight" />
        <div className="mt-4 h-12 w-80 animate-pulse rounded bg-brand-bgLight" />
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-none border border-brand-border bg-cream-50 p-4">
              <div className="aspect-square animate-pulse rounded-none bg-brand-bgLight" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-brand-bgLight" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-brand-bgLight" />
              <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-brand-bgLight" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}