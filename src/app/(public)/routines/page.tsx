import Link from "next/link";
import Image from "next/image";
import { getBundles } from "@/lib/data/bundles";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { formatNPR } from "@/lib/utils";

export const metadata = createMetadata({
  title: "Beauty Routines — GLAMO NEPAL",
  description: "Discover curated beauty routines at GLAMO NEPAL. Step-by-step skincare, haircare, and makeup bundles designed for Nepal's climate.",
  path: "/routines",
  keywords: ["beauty routines", "skincare routine Nepal", "GLAMO NEPAL", "beauty bundles"],
});

export default function RoutinesPage() {
  const bundles = getBundles();

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Routines", path: "/routines" }])} />
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Curated routines</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-brand-textPrimary md:text-7xl">Beauty Routines</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-brand-textMuted">Step-by-step beauty routines curated for Nepal&rsquo;s climate. Each bundle saves you more than buying individually.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <Link key={bundle.slug} href={`/routines/${bundle.slug}`} className="group overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={bundle.image} alt={bundle.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bgDark/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <span className="font-label rounded-full bg-brand-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">{bundle.concerns[0]}</span>
                  <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-brand-gold shadow-md backdrop-blur">{formatNPR(bundle.bundlePrice)}</span>
                </div>
              </div>
              <div className="p-6">
                <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">{bundle.eyebrow}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-brand-textPrimary group-hover:text-brand-primary transition-colors">{bundle.title}</h2>
                <p className="mt-2 text-sm leading-6 text-brand-textMuted line-clamp-2">{bundle.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bundle.skinTypes.slice(0, 3).map((tag) => (
                    <span key={tag} className="font-label rounded-full bg-brand-primary-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-primary">{tag}</span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-semibold text-brand-primary">{bundle.products.length} products &middot; Save {formatNPR(bundle.savings)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}