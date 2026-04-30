import { ProductBundleCard } from "@/components/product/ProductBundleCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBundles } from "@/lib/mock/bundles";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Routine Builder",
  description: "Explore GLAMO NEPAL skincare, makeup and gifting routine bundles with NPR pricing.",
  path: "/routines",
  keywords: ["beauty routine Nepal", "skincare routine Kathmandu", "GLAMO routine builder"],
});

export default function RoutinesPage() {
  const bundles = getBundles();
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Routines", path: "/routines" }])} />
      <section className="bg-brand-bgDark py-16 text-white md:py-24">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Routine builder</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">Build a GLAMO Routine</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">Curated bundles for daily glow, sensitive barrier care, festival makeup and Made in Nepal gifting.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Conversion feature</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">Routine-ready bundles</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-brand-textMuted">Pick a routine that fits your skin goals, occasion or gifting plan.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {bundles.map((bundle) => <ProductBundleCard key={bundle.slug} bundle={bundle} />)}
        </div>
      </section>
    </main>
  );
}
