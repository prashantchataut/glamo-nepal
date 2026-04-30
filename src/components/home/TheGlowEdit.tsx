"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { GLOW_EDIT_TABS, GLOW_EDIT_PRODUCTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MoveRight } from "lucide-react";
import Link from "next/link";

export function TheGlowEdit() {
  const [activeTab, setActiveTab] = useState(GLOW_EDIT_TABS[0]);
  const products = GLOW_EDIT_PRODUCTS[activeTab] || GLOW_EDIT_PRODUCTS["Best Sellers"];

  return (
    <section className="py-20 md:py-28 bg-brand-bgLight">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-8 text-brand-textPrimary">
            The <span className="text-brand-primary italic">Glow Edit</span>
          </h2>

          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
            {GLOW_EDIT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300",
                  activeTab === tab
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-white text-brand-textMuted hover:bg-white hover:text-brand-primary border border-border/50 hover:border-brand-primary/20"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12">
          {products.map((product, i) => (
            <div key={`${activeTab}-${product.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 80}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-brand-textPrimary text-brand-textPrimary rounded-full font-semibold uppercase tracking-[0.15em] text-sm hover:bg-brand-textPrimary hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            View All Collection <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}