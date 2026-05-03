import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { getBundles } from "@/lib/data/bundles";
import { createMetadata } from "@/lib/seo";
import { formatNPR } from "@/lib/utils";

export const metadata = createMetadata({ title: "Beauty Routines", description: "Shop GLAMO NEPAL routine bundles for skincare, soft glam makeup and gifting.", path: "/routines" });

export default function RoutinesIndexPage() {
  const bundles = getBundles();
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <PageHeader eyebrow="Routine finder" title="Build a beauty ritual, not a random cart" description="Editorial routine bundles help customers understand order, pairings and savings with clear product hierarchy." />
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <Link key={bundle.slug} href={`/routines/${bundle.slug}`} className="group overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-[0_24px_80px_-60px_rgba(36,31,34,0.45)] transition hover:-translate-y-1 hover:border-brand-primary/25">
              <div className="relative aspect-[16/11] overflow-hidden bg-brand-primary-light">
                <Image src={bundle.image} alt={bundle.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
                <span className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary backdrop-blur">{bundle.eyebrow}</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4"><h2 className="font-serif text-3xl font-semibold leading-none text-brand-textPrimary">{bundle.title}</h2><span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary transition group-hover:bg-brand-primary group-hover:text-white"><ArrowRight size={18} /></span></div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-brand-textMuted">{bundle.description}</p>
                <div className="mt-5 grid gap-2 text-sm text-brand-textMuted">
                  <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-brand-primary" /> {bundle.products.length} products</span>
                  <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-brand-primary" /> Bundle price {formatNPR(bundle.bundlePrice)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">{[...bundle.skinTypes, ...bundle.concerns].slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold text-brand-textMuted">{tag}</span>)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
