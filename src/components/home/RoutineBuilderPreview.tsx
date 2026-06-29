import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductBundleCard } from "@/components/product/ProductBundleCard";
import { getBundles } from "@/lib/data/bundles";

export function RoutineBuilderPreview() {
  const bundles = getBundles().slice(0, 2);
  return (
    <section aria-labelledby="routine-builder-heading" className="bg-white py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-6 md:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500 text-secondary">Routine builder</p>
            <h2 id="routine-builder-heading" className="mt-2 font-display text-3xl font-semibold text-neutral-900 md:text-4xl lg:text-5xl">Shop by routine, not just product</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">Skincare routines, festival glam kits and Made in Nepal gifting edits designed for easier beauty shopping.</p>
          </div>
          <Link href="/routines" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-neutral-50 transition hover:bg-neutral-800">
            Explore routines <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {bundles.map((bundle) => <ProductBundleCard key={bundle.slug} bundle={bundle} compact />)}
        </div>
      </div>
    </section>
  );
}
