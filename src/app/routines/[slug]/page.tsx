import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, PackageCheck, ShieldAlert } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductBundleCard } from "@/components/product/ProductBundleCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRODUCT_BUNDLES, getBundle, getBundles } from "@/lib/data/bundles";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { formatNpr } from "@/lib/utils";

export function generateStaticParams() {
  return PRODUCT_BUNDLES.map((bundle) => ({ slug: bundle.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const bundle = getBundle(params.slug);
  return createMetadata({
    title: bundle?.title || "Routine",
    description: bundle?.description || "GLAMO NEPAL beauty routine bundle.",
    path: `/routines/${params.slug}`,
    image: bundle?.image,
    keywords: bundle ? [bundle.title, ...bundle.concerns, ...bundle.skinTypes] : ["GLAMO routine"],
  });
}

export default function RoutineDetailPage({ params }: { params: { slug: string } }) {
  const bundle = getBundle(params.slug);
  if (!bundle) notFound();
  const otherBundles = getBundles().filter((item) => item.slug !== bundle.slug).slice(0, 2);

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Routines", path: "/routines" }, { name: bundle.title, path: `/routines/${bundle.slug}` }])} />
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)]">
        <div className="container mx-auto grid gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-14">
          <div className="self-center">
            <Link href="/routines" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand-primary transition hover:text-brand-primary-hover"><ArrowLeft size={16} /> Back to routines</Link>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">{bundle.eyebrow}</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-brand-textPrimary md:text-7xl">{bundle.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-brand-textMuted">{bundle.description}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[...bundle.skinTypes, ...bundle.concerns].slice(0, 8).map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-primary shadow-sm ring-1 ring-brand-border">{tag}</span>)}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-[0_26px_90px_-60px_rgba(36,31,34,0.45)]">
            <Image src={bundle.image} alt={bundle.title} fill priority className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Routine steps</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">How this routine works</h2>
            <div className="mt-6 grid gap-4">
              {bundle.steps.map((step, index) => {
                const product = bundle.products.find((item) => item.slug === step.productSlug);
                return (
                  <div key={step.productSlug} className="flex gap-4 rounded-3xl border border-border/70 bg-brand-bgLight p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary font-bold text-white">{index + 1}</span>
                    <div>
                      <h3 className="font-serif text-2xl font-semibold text-brand-textPrimary">{step.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-brand-textMuted">{step.note}</p>
                      {product ? <Link href={`/product/${product.slug}`} className="mt-2 inline-flex text-sm font-semibold text-brand-primary">View {product.name}</Link> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Included products</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{bundle.products.length} routine items</h2>
              </div>
              <p className="text-sm font-semibold text-brand-gold">Bundle price {formatNpr(bundle.bundlePrice)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {bundle.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <PackageCheck className="mb-3 text-brand-primary" />
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Routine summary</h2>
            <div className="mt-4 space-y-3 text-sm text-brand-textMuted">
              <div className="flex justify-between"><span>Subtotal</span><strong className="text-brand-textPrimary">{formatNpr(bundle.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Bundle price</span><strong className="text-brand-gold">{formatNpr(bundle.bundlePrice)}</strong></div>
              <div className="flex justify-between"><span>Bundle saving</span><strong className="text-brand-primary">{formatNpr(bundle.savings)}</strong></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900">
            <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Patch test new products and follow each product's packaging directions. Contact GLAMO before purchase if you need help choosing a routine for sensitive skin.</p></div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 text-sm text-brand-textMuted shadow-sm">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" /><p>Bundle savings are shown for easy review. Final pricing is confirmed at checkout.</p></div>
          </div>
        </aside>
      </section>

      <section className="container mx-auto px-4 pb-14 md:px-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">More routines</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">Recommended next</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {otherBundles.map((item) => <ProductBundleCard key={item.slug} bundle={item} compact />)}
        </div>
      </section>
    </main>
  );
}
