export default function BlogPostLoading() {
  return (
    <main className="bg-neutral-50 section-padding page-padding">
      <div className="mx-auto max-w-3xl">
        <div className="space-y-4">
          <div className="h-3 w-20 rounded skeleton-shimmer" />
          <div className="h-10 w-3/4 rounded skeleton-shimmer" />
          <div className="h-4 w-1/3 rounded skeleton-shimmer" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded skeleton-shimmer" />
            <div className="h-64 w-full rounded-[1.5rem] skeleton-shimmer" />
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </main>
  );
}