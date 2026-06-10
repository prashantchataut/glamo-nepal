

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_PILLS } from "@/lib/constants";

export function QuickCategoryPills() {
  return (
    <section aria-labelledby="quick-category-pills-heading" className="bg-white py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Shop by category</p>
            <h2 id="quick-category-pills-heading" className="mt-2 font-display text-3xl font-semibold text-neutral-900 md:text-4xl">Find your beauty favorites</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-neutral-950">
            View all products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 md:gap-4">
          {CATEGORY_PILLS.map((pill) => (
            <Link
              href={pill.link}
              key={pill.id}
              className="inline-flex items-center rounded-full border border-neutral-900/10 bg-rose-50 px-5 py-3 text-sm font-medium text-neutral-900 transition-all duration-300 hover:border-primary/30 hover:bg-white hover:text-primary hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {pill.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
