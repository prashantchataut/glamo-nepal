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
    <Section label="Shop by category" heading="Choose your ritual" subheading="Visual doors into skincare, makeup, hair care and fragrance — built for browsing, not guessing." className="bg-white">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category, index) => (
          <Link key={category.name} href={category.href} className={index === 0 ? "group sm:col-span-2 lg:col-span-1" : "group"}>
            <article className="h-full overflow-hidden rounded-[30px] border border-neutral-200 bg-[#fbf7f3] shadow-[0_18px_60px_-48px_rgba(26,21,18,0.45)] transition-all hover:-translate-y-0.5 hover:border-primary/35">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image src={category.image} alt={`${category.name} beauty category`} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" />
              </div>
              <div className="p-4">
                <h3 className="font-display text-2xl text-neutral-900">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">{category.copy}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Shop now</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </Section>
  );
}
