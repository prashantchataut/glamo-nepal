export default function CheckoutLoading() {
  return (
    <main className="bg-brand-bgLight py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-40 animate-pulse rounded-[2rem] bg-brand-bgLight" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="h-60 animate-pulse rounded-[2rem] bg-brand-bgLight" />
            <div className="h-40 animate-pulse rounded-[2rem] bg-brand-bgLight" />
          </div>
          <div className="h-80 animate-pulse rounded-[2rem] bg-brand-bgLight" />
        </div>
      </div>
    </main>
  );
}