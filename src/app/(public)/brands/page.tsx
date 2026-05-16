import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EditorialHero, EditorialSection } from "@/components/common/EditorialPage";
import { getBrandProfiles } from "@/lib/brands";
import { IMAGES } from "@/lib/image-library";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Beauty Brands", description: "Discover curated skincare, makeup, haircare and Nepal-made beauty brands at GLAMO Nepal.", path: "/brands" });

export default function BrandsPage() {
  const brands = getBrandProfiles();
  return (
    <main className="bg-neutral-50">
      <EditorialHero eyebrow="Brand directory" title="Curated brands, not endless shelves." description="Browse global favourites, practical routine staples and Nepal-made beauty stories selected for authenticity, performance and everyday use." image={IMAGES.categories.fragrance} imageAlt="Perfume bottles on a premium beauty counter" />
      <EditorialSection title="Explore brands" description={`${brands.length} brand edits organized for faster product discovery.`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link key={brand.slug} href={`/brands/${brand.slug}`} className="group border border-neutral-200 bg-white p-5 transition-colors hover:border-primary/30">
              <div className="flex items-start gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-50">
                  <Image src={brand.image} alt={`${brand.name} logo`} fill className="object-contain p-3" sizes="80px" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-medium leading-tight text-neutral-900 group-hover:text-primary">{brand.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{brand.productCount} products · {brand.categories.join(", ") || "Beauty"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {brand.concerns.slice(0, 3).map((concern) => <span key={concern} className="bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600">{concern}</span>)}
                  </div>
                </div>
                <ArrowRight size={18} className="mt-1 text-neutral-300 transition-colors group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </EditorialSection>
    </main>
  );
}
