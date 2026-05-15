"use client";
import Image from "next/image";
import Link from "next/link";
import { SHOP_CATEGORIES } from "@/lib/constants";

export function ShopByCategory() {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white" aria-labelledby="shop-category-heading">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="shop-category-heading" className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-brand-textPrimary">
            Shop by <span className="text-brand-primary italic">Category</span>
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-6">
          {SHOP_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group flex flex-col items-center gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-xl outline-none transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative aspect-square w-full rounded-full overflow-hidden p-1.5 border-2 border-transparent group-hover:border-brand-primary/30 transition-all duration-500 group-hover:scale-105">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-brand-bgLight">
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16.666vw"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <span className="font-medium text-brand-textPrimary group-hover:text-brand-primary transition-colors duration-300 text-sm md:text-base text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}