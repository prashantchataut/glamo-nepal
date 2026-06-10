import Link from "next/link";
import Image from "next/image";
import { PRODUCT_COLLECTIONS, getCollectionProducts } from "@/lib/collections";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Collections � GLAMO NEPAL",
  description: "Explore curated beauty collections at GLAMO NEPAL. Shop festival edits, best sellers, and made-in-Nepal picks.",
  path: "/collections",
  keywords: ["beauty collections", "GLAMO NEPAL", "skincare bundles", "Nepal beauty"],
});

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }])} />

      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-50 via-white to-white">
        <div className="mx-auto max-w-[1480px] px-4 py-14 md:px-8 md:py-20 lg:py-24">
          <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-primary">Curated edits</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-neutral-900 md:text-7xl lg:text-8xl">
            Collections
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-neutral-500 md:mt-6 md:text-lg">
            Explore curated beauty collections designed for every mood, routine, and occasion.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 pb-16 pt-4 md:px-8 md:pb-24 md:pt-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_COLLECTIONS.map((collection) => {
            const productCount = getCollectionProducts(collection.slug).length;
            return (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="group overflow-hidden rounded-[1.75rem] border border-neutral-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
                <div className="p-6 pb-7">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{collection.eyebrow}</p>
                  <h2 className="mt-2.5 font-display text-[1.375rem] font-semibold leading-snug text-neutral-900 transition-colors duration-200 group-hover:text-primary">
                    {collection.title}
                  </h2>
                  <p className="mt-2 text-[13px] leading-6 text-neutral-500 line-clamp-2">{collection.description}</p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    {productCount} product{productCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}