import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductBundleCard } from "@/components/product/ProductBundleCard";
import { getBundles } from "@/lib/mock/bundles";

export function RoutineBuilderPreview() {
  const bundles = getBundles().slice(0, 2);
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Routine builder</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">Shop by routine, not just product</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-textMuted">Bundle-ready frontend patterns for skincare routines, festival glam kits and Made in Nepal gifting.</p>
          </div>
          <Link href="/routines" className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-bgDark">
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
