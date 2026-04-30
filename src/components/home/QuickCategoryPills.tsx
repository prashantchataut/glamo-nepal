"use client";

import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { CATEGORY_PILLS } from "@/lib/constants";

export function QuickCategoryPills() {
  return (
    <div className="w-full bg-white py-6 md:py-8 border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-4 pb-2 -mb-2 snap-x snap-mandatory">
          {CATEGORY_PILLS.map((pill) => (
            <Link
              href={pill.link}
              key={pill.id}
              className="flex-shrink-0 snap-start group"
            >
              <div className="flex items-center gap-3 bg-brand-bgLight/80 hover:bg-brand-secondary/15 border border-brand-secondary/20 hover:border-brand-primary/30 rounded-full pr-5 pl-1.5 py-1.5 transition-all duration-300 hover:shadow-md">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border border-border/30">
                  <Image
                    src={pill.image}
                    alt={pill.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="44px"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-brand-textPrimary group-hover:text-brand-primary transition-colors whitespace-nowrap">
                    {pill.name}
                  </span>
                  <span className="text-[9px] text-brand-textMuted uppercase font-bold tracking-[0.1em] flex items-center gap-0.5 group-hover:text-brand-textPrimary transition-colors">
                    Shop Now <MoveRight size={8} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}