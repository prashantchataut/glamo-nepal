import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBrandProfiles } from "@/lib/brands";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Brands",
  description: "Browse GLAMO NEPAL beauty brands curated for skincare, makeup, haircare and gifting.",
  path: "/brands",
  keywords: ["beauty brands Nepal", "GLAMO brands", "cosmetics Nepal"],
});

export default function BrandsPage() {
  const brands = getBrandProfiles();
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }])} />
      <section className="bg-brand-bgDark py-16 text-white md:py-24">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Curated beauty brands</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">Shop by Brand</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">Explore beauty brands, category edits and Nepal-ready product selections curated by GLAMO NEPAL.</p>
        </div>
      </section>
      <section className="container mx-auto grid gap-4 px-4 py-10 md:grid-cols-2 md:px-6 lg:grid-cols-3 xl:grid-cols-4">
        {brands.map((brand) => (
          <Link key={brand.slug} href={`/brands/${brand.slug}`} className="group rounded-[2rem] border border-brand-secondary/20 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30">
            <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-2xl bg-brand-bgLight">
              <Image src={brand.image} alt={`${brand.name} brand visual`} fill className="object-cover" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary transition group-hover:text-brand-primary">{brand.name}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-brand-textMuted">{brand.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-brand-primary">
              <span className="rounded-full bg-brand-bgLight px-3 py-1">{brand.productCount} products</span>
              {brand.madeInNepalCount ? <span className="rounded-full bg-brand-bgLight px-3 py-1">{brand.madeInNepalCount} local</span> : null}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
