import Image from "next/image";
import Link from "next/link";
import { getBrandProfiles } from "@/lib/brands";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Our Brands",
  description: "Explore all beauty brands curated by GLAMO NEPAL — authentic skincare, haircare and cosmetics selected for Nepal-market shoppers.",
  path: "/brands",
  keywords: ["beauty brands Nepal", "GLAMO brands", "skincare Nepal", "cosmetics Nepal"],
});

export default function BrandsPage() {
  const brands = getBrandProfiles();

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }])} />

      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Brand directory</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-brand-textPrimary md:text-7xl">Our Brands</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-brand-textMuted">
            Authentic beauty brands curated for Nepal-market shoppers — skincare, haircare and cosmetics you can trust.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-brand-bgLight">
                <Image
                  src={brand.image}
                  alt={`${brand.name} brand`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 md:p-5">
                <h2 className="font-display text-lg font-semibold text-brand-textPrimary">{brand.name}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-brand-textMuted">{brand.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {brand.concerns.slice(0, 3).map((concern) => (
                    <span key={concern} className="rounded-full bg-brand-bgLight px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary ring-1 ring-brand-border">
                      {concern}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold text-brand-textMuted">
                  {brand.productCount} product{brand.productCount !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}