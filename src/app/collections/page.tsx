import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCT_COLLECTIONS, getCollectionProducts } from "@/lib/collections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Collections",
  description: "Shop GLAMO NEPAL beauty edits including new arrivals, best sellers, Made in Nepal, festival-ready and under NPR 1,000 collections.",
  path: "/collections",
});

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <section className="bg-brand-bgDark py-16 text-center text-white md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">GLAMO edits</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">Beauty Collections</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">Merchandising-ready collections for campaigns, price points, local beauty and seasonal shopping moments.</p>
        </div>
      </section>
      <section className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-2 md:px-6 md:py-14 xl:grid-cols-3">
        {PRODUCT_COLLECTIONS.map((collection) => {
          const count = getCollectionProducts(collection.slug).length;
          return (
            <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group overflow-hidden rounded-[2rem] border border-brand-secondary/20 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
              <div className="relative aspect-[16/10] bg-brand-bgLight">
                <Image src={collection.image} alt={collection.title} fill className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">{collection.eyebrow}</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{collection.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-brand-textMuted">{collection.description}</p>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-brand-primary">
                  <span>{count} product{count === 1 ? "" : "s"}</span>
                  <span className="inline-flex items-center gap-1">Open edit <ArrowRight size={16} /></span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
