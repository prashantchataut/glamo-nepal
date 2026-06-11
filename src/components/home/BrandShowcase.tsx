import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGOS } from "@/lib/constants";
import { Section } from "@/components/common/Section";

export function BrandShowcase() {
  return (
    <Section
      heading="Brands We Trust"
      cta={{ label: "View All Brands", href: "/brands" }}
    >
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:gap-4 lg:grid-cols-6">
        {BRAND_LOGOS.slice(0, 6).map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            className="group flex aspect-square items-center justify-center rounded-[1.5rem] border border-neutral-200/80 bg-white p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-soft cursor-pointer"
          >
            <Image
              src={brand.image}
              alt={brand.name}
              width={120}
              height={40}
              loading="lazy"
              className="h-8 w-auto object-contain opacity-50 transition-all duration-300 group-hover:opacity-100 group-hover:scale-[1.05]"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}