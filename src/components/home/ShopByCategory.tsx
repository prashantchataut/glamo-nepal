"use client";

import Image from "next/image";
import Link from "next/link";
import { SHOP_CATEGORIES } from "@/lib/constants";
import { Section } from "@/components/common/Section";

export function ShopByCategory() {
  return (
    <Section
      label="Shop by Category"
      heading="Find Your Ritual"
      align="center"
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {SHOP_CATEGORIES.slice(0, 4).map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className="group relative aspect-[3/4] overflow-hidden bg-neutral-100 cursor-pointer"
          >
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <span className="type-label text-[10px] text-white/70 mb-1">
                {category.name}
              </span>
              <h3 className="font-display text-xl font-medium text-white leading-tight">
                {category.name}
              </h3>
              <span className="mt-2 inline-flex items-center gap-1 text-[12px] text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Shop Now
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}