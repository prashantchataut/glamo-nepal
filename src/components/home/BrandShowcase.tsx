import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/common/Section";
import { IMAGES } from "@/lib/image-library";

const brands = [
  { name: "Beauty of Joseon", href: "/brands/beauty-of-joseon", image: IMAGES.heroProducts.boj, span: "sm:col-span-2" },
  { name: "COSRX", href: "/brands/cosrx", image: IMAGES.categories.skincare, span: "" },
  { name: "Maybelline", href: "/brands/maybelline", image: IMAGES.categories.makeup, span: "" },
  { name: "The Ordinary", href: "/brands/the-ordinary", image: IMAGES.editorial.texture, span: "" },
  { name: "Cetaphil", href: "/brands/cetaphil", image: IMAGES.heroProducts.cetaphil, span: "sm:col-span-2" },
];

export function BrandShowcase() {
  return (
    <Section
      label="Featured brands"
      heading="Shelves with a point of view"
      subheading="Brand discovery should feel like browsing a boutique table — photographic, tactile and curated."
      cta={{ label: "View all brands", href: "/brands" }}
      className="bg-cream-50"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.name}
            href={brand.href}
            className={`group relative min-h-[220px] overflow-hidden bg-cream-100 ${brand.span}`}
          >
            <Image src={brand.image} alt={`${brand.name} brand shelf`} fill className="object-cover transition duration-700 group-hover:scale-[1.04]" sizes="(max-width: 640px) 100vw, 33vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-cream-50">
              <h3 className="font-display text-3xl font-light leading-none tracking-[-0.03em]">{brand.name}</h3>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/35 bg-white/10 backdrop-blur-sm transition group-hover:bg-cream-50 group-hover:text-ink">
                <ArrowUpRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
