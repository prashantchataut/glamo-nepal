import Link from "next/link";
import Image from "next/image";
import { PRODUCT_COLLECTIONS, getCollectionProducts } from "@/lib/collections";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Collections — GLAMO NEPAL",
  description: "Explore curated beauty collections at GLAMO NEPAL. Shop festival edits, best sellers, and made-in-Nepal picks.",
  path: "/collections",
  keywords: ["beauty collections", "GLAMO NEPAL", "skincare bundles", "Nepal beauty"],
});

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }])} />
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Curated edits</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-brand-textPrimary md:text-7xl">Collections</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-brand-textMuted">Explore curated beauty collections designed for every mood, routine, and occasion.</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_COLLECTIONS.map((collection) => {
            const productCount = getCollectionProducts(collection.slug).length;
            return (
              <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 outline-none">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={collection.image} alt={collection.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-bgDark/40 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">{collection.eyebrow}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-brand-textPrimary group-hover:text-brand-primary transition-colors">{collection.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-textMuted line-clamp-2">{collection.description}</p>
                  <p className="mt-3 text-xs font-semibold text-brand-primary">{productCount} products</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}