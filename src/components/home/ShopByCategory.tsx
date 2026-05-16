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
      subheading="Five visual doors into the GLAMO edit — quiet, intentional, and easy to browse."
      className="bg-cream-50"
      align="left"
    >
      <div className="grid gap-px bg-cream-200 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <Link key={category.name} href={category.href} className="group block bg-cream-50">
            <article className="relative min-h-full p-3 transition duration-500 hover:bg-cream-100">
              <div className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center border border-cream-200 bg-cream-50 text-ink transition group-hover:border-brand-rose group-hover:text-brand-rose">
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-100">
                <Image
                  src={category.image}
                  alt={`${category.name} beauty category`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.035]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
              </div>
              <div className="flex items-end justify-between px-1 py-5">
                <h3 className="font-display text-heading-lg italic text-ink">( {category.name} )</h3>
                <span className="type-label-sm text-brand-deep">Explore</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </Section>
  );
}
