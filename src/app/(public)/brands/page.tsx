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
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }])} />

      <section className="border-b border-neutral-200 bg-[#fbf7f3] py-12 md:py-20">
        <div className="container mx-auto px-5 sm:px-8">
          <p className="type-label text-primary">Brand directory</p>
          <h1 className="mt-3 font-display text-5xl font-light leading-none tracking-[-0.02em] text-neutral-900 md:text-7xl">Our Brands</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-600">
            Authentic beauty brands curated for Nepal-market shoppers — skincare, haircare and cosmetics selected with clear routines in mind.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group cursor-pointer overflow-hidden border border-neutral-200 bg-white transition-colors hover:border-primary/40"
            >
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <Image
                  src={brand.image}
                  alt={`${brand.name} brand`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 md:p-5">
                <h2 className="font-display text-2xl font-light text-neutral-900">{brand.name}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-neutral-500">{brand.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {brand.concerns.slice(0, 3).map((concern) => (
                    <span key={concern} className="border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {concern}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold text-neutral-400">
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