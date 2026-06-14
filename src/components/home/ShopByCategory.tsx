import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/common/Section";
import { IMAGES } from "@/lib/image-library";

const categories = [
  { name: "Skincare", href: "/shop?category=skincare", image: IMAGES.categories.skincare, copy: "Cleansers, serums and daily SPF." },
  { name: "Makeup", href: "/shop?category=makeup", image: IMAGES.categories.makeup, copy: "Color, glow and polished essentials." },
  { name: "Hair Care", href: "/shop?category=haircare", image: IMAGES.categories.haircare, copy: "Healthy lengths and wash-day staples." },
  { name: "Body & Wellness", href: "/shop?category=bodycare", image: IMAGES.categories.body, copy: "Bath, body and soft fragrance rituals." },
  { name: "Fragrance", href: "/shop?category=fragrance", image: IMAGES.categories.fragrance, copy: "Scents for daily signature moments." },
];

export function ShopByCategory() {
  return (
    <Section heading="Choose your ritual" subheading="Skincare, makeup, hair care and fragrance, curated for you." className="bg-white">
<div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory md:mx-0 md:grid md:grid-cols-3 md:overflow-x-visible md:px-0 md:snap-none lg:grid-cols-5 md:pb-0">
          {categories.map((category) => (
            <Link key={category.name} href={category.href} className="group min-w-[65vw] snap-start sm:min-w-[45vw] md:min-w-0">
            <article className="h-full overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/25">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image src={category.image} alt={`${category.name} beauty category`} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" />
              </div>
              <div className="px-4 pb-5 pt-3">
                <h3 className="font-display text-xl font-semibold text-neutral-900 transition-colors group-hover:text-primary">{category.name}</h3>
                <p className="mt-1.5 text-sm leading-6 text-neutral-500">{category.copy}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </Section>
  );
}
