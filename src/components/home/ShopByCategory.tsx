"use client";

import Image from "next/image";
import Link from "next/link";
import { SHOP_CATEGORIES } from "@/lib/constants";

export function ShopByCategory() {
  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-brand-textPrimary">
            Shop by <span className="text-brand-primary italic">Category</span>
          </h2>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-6 md:gap-8 pb-4 -mb-4 snap-x snap-mandatory md:justify-center">
          {SHOP_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center gap-4 flex-shrink-0 snap-start w-28 md:w-36"
            >
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden p-1.5 border-2 border-transparent group-hover:border-brand-primary/30 transition-all duration-500 group-hover:scale-105">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-brand-bgLight">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 112px, 144px"
                  />
                </div>
              </div>
              <span className="font-medium text-brand-textPrimary group-hover:text-brand-primary transition-colors duration-300 text-sm md:text-base">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}