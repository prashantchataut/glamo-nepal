

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORY_PILLS } from "@/lib/constants";

export function QuickCategoryPills() {
  return (
    <section aria-labelledby="quick-category-pills-heading" className="bg-cream-50 py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">Shop by category</p>
            <h2 id="quick-category-pills-heading" className="mt-2 font-display text-3xl font-semibold text-brand-textPrimary md:text-4xl">Find your beauty favorites</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary transition hover:text-brand-bgDark">
            View all products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 md:gap-4">
          {CATEGORY_PILLS.map((pill) => (
            <Link
              href={pill.link}
              key={pill.id}
              className="inline-flex items-center rounded-2xl border border-brand-textPrimary/10 bg-brand-surfacePink px-5 py-3 text-sm font-medium text-brand-textPrimary transition-all duration-300 hover:border-brand-primary/30 hover:bg-cream-50 hover:text-brand-primary hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {pill.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
