import { Skeleton } from "@/components/common/Skeleton";

export default function RoutinesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-brand-bgLight py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-12 w-64" />
          <Skeleton className="mt-5 h-6 w-96" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
              <Skeleton className="aspect-[16/10]" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}