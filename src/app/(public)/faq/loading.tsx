export default function Loading() {
  return (
    <main className="min-h-[60vh] bg-neutral-50 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 h-5 w-36 rounded-full skeleton-shimmer" />
        <div className="mb-4 h-12 w-2/3 max-w-xl rounded-2xl skeleton-shimmer" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] bg-white p-5 shadow-sm">
              <div className="mb-4 aspect-[4/3] rounded-2xl skeleton-shimmer" />
              <div className="mb-3 h-5 rounded-xl skeleton-shimmer" />
              <div className="h-4 w-2/3 rounded-xl skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
