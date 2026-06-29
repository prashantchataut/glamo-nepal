export default function CheckoutLoading() {
  return (
    <main className="bg-neutral-50 py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-40 animate-pulse rounded-[1.5rem] bg-neutral-50" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="h-60 animate-pulse rounded-[1.5rem] bg-neutral-50" />
            <div className="h-40 animate-pulse rounded-[1.5rem] bg-neutral-50" />
          </div>
          <div className="h-80 animate-pulse rounded-[1.5rem] bg-neutral-50" />
        </div>
      </div>
    </main>
  );
}