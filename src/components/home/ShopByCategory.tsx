import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/common/Section";
import { IMAGES } from "@/lib/image-library";

const categories = [
  { name: "skincare", href: "/shop?category=skincare", image: IMAGES.categories.skincare },
  { name: "makeup", href: "/shop?category=makeup", image: IMAGES.categories.makeup },
  { name: "hair", href: "/shop?category=haircare", image: IMAGES.categories.haircare },
  { name: "body", href: "/shop?category=bodycare", image: IMAGES.categories.body },
  { name: "fragrance", href: "/shop?category=fragrance", image: IMAGES.categories.fragrance },
];

export function ShopByCategory() {
  return (
    <Section
      label="Shop by category"
      heading="Choose your ritual"
      subheading="Parenthetical categories, real photography and soft cream surfaces — inspired by editorial beauty catalogs, not app cards."
      className="bg-cream-50"
    >
      <div className="mobile-bleed flex gap-px overflow-x-auto bg-cream-200 px-4 pb-2 mobile-snap no-scrollbar sm:mx-0 sm:grid sm:w-auto sm:grid-cols-2 sm:px-0 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((category, index) => (
          <Link
            key={category.name}
            href={category.href}
            className="group block min-w-[76vw] bg-cream-50 outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-4 sm:min-w-0"
          >
            <article className="relative min-h-full p-2.5 transition duration-500 hover:bg-cream-100 sm:p-3">
              <div className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border border-cream-200 bg-cream-50 text-ink transition group-hover:border-brand-rose group-hover:text-brand-rose">
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-100">
                <Image
                  src={category.image}
                  alt={`${category.name} beauty category`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.035]"
                  sizes="(max-width: 640px) 76vw, (max-width: 1024px) 50vw, 20vw"
                />
              </div>
              <div className="flex items-end justify-between gap-4 px-1 py-4 sm:py-5">
                <h3 className="font-display text-heading-xl italic leading-none text-ink">( {category.name} )</h3>
                <span className="type-label-sm text-brand-deep">{String(index + 1).padStart(2, "0")}</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </Section>
  );
}
