export default function OrderConfirmationLoading() {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl text-center py-16">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-neutral-100" />
        <div className="mt-6 h-8 w-48 mx-auto animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 h-4 w-64 mx-auto animate-pulse rounded bg-neutral-100" />
        <div className="mt-8 animate-pulse rounded-[1.5rem] bg-neutral-100 p-8 space-y-4">
          <div className="h-4 w-1/3 rounded bg-neutral-200" />
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
          <div className="h-4 w-1/2 rounded bg-neutral-200" />
        </div>
      </div>
    </main>
  );
}