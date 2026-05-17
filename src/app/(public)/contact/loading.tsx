export default function ContactLoading() {
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <div className="h-48 animate-pulse bg-brand-bgLight" />
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="h-8 w-48 animate-pulse rounded bg-brand-bgLight" />
            <div className="h-12 animate-pulse rounded-xl bg-brand-bgLight" />
            <div className="h-12 animate-pulse rounded-xl bg-brand-bgLight" />
            <div className="h-32 animate-pulse rounded-xl bg-brand-bgLight" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-brand-bgLight" />
        </div>
      </div>
    </main>
  );
}