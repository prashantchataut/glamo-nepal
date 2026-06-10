import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, PackageCheck, ShieldAlert } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductBundleCard } from "@/components/product/ProductBundleCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRODUCT_BUNDLES, getBundle, getBundles } from "@/lib/data/bundles";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { formatNPR } from "@/lib/utils";

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
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Routines", path: "/routines" }, { name: bundle.title, path: `/routines/${bundle.slug}` }])} />
      <section className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient">
        <div className="container mx-auto grid gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_0.9fr] lg:py-14">
          <div className="self-center">
            <Link href="/routines" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"><ArrowLeft size={16} /> Back to routines</Link>
            <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">{bundle.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight text-neutral-900 md:text-7xl">{bundle.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-500">{bundle.description}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[...bundle.skinTypes, ...bundle.concerns].slice(0, 8).map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm ring-1 ring-neutral-200">{tag}</span>)}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-page-hero">
            <Image src={bundle.image} alt={bundle.title} fill sizes="(max-width: 1024px) 100vw, 420px" priority className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8">
            <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-secondary">Routine steps</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-neutral-900">How this routine works</h2>
            <div className="mt-6 grid gap-4">
              {bundle.steps.map((step, index) => {
                const product = bundle.products.find((item) => item.slug === step.productSlug);
                return (
                  <div key={step.productSlug} className="flex gap-4 rounded-3xl border border-border/70 bg-neutral-50 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">{index + 1}</span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-neutral-900">{step.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">{step.note}</p>
                      {product ? <Link href={`/products/${product.slug}`} className="mt-2 inline-flex text-sm font-semibold text-primary">View {product.name}</Link> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-secondary">Included products</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-neutral-900">{bundle.products.length} routine items</h2>
              </div>
              <p className="text-sm font-semibold text-secondary">Bundle price {formatNPR(bundle.bundlePrice)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {bundle.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <PackageCheck className="mb-3 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Routine summary</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-500">
              <div className="flex justify-between"><span>Subtotal</span><strong className="text-neutral-900">{formatNPR(bundle.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Bundle price</span><strong className="text-secondary">{formatNPR(bundle.bundlePrice)}</strong></div>
              <div className="flex justify-between"><span>Bundle saving</span><strong className="text-primary">{formatNPR(bundle.savings)}</strong></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900">
            <div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Patch test new products and follow each product&apos;s packaging directions. Contact GLAMO before purchase if you need help choosing a routine for sensitive skin.</p></div>
          </div>
          <div className="rounded-[2rem] bg-white p-5 text-sm text-neutral-500 shadow-sm">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p>Bundle savings are shown for easy review. Final pricing is confirmed at checkout.</p></div>
          </div>
        </aside>
      </section>

      <section className="container mx-auto px-4 pb-14 md:px-6">
        <div className="mb-5">
          <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-secondary">More routines</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-neutral-900">Recommended next</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {otherBundles.map((item) => <ProductBundleCard key={item.slug} bundle={item} compact />)}
        </div>
      </section>
    </main>
  );
}
