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
    <section className="py-12 md:py-16 lg:py-20 bg-brand-bgLight" aria-labelledby="glow-edit-heading">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-10">
          <h2 id="glow-edit-heading" className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-6 md:mb-8 text-brand-textPrimary tracking-tight">
            The <span className="text-brand-primary italic">Glow Edit</span>
          </h2>

          <div role="tablist" aria-label="Product categories" className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
            {GLOW_EDIT_TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls="glow-edit-panel"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-300",
                  activeTab === tab
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-cream-50 text-brand-textMuted hover:bg-cream-50 hover:text-brand-primary border border-border/50 hover:border-brand-primary/20"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div id="glow-edit-panel" role="tabpanel" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {products.map((product, i) => (
            <div key={`${activeTab}-${product.id}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 80}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/shop" className="font-label inline-flex items-center gap-2 px-8 py-3.5 border-2 border-brand-textPrimary text-brand-textPrimary rounded-2xl font-semibold uppercase tracking-[0.15em] text-sm hover:bg-brand-textPrimary hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            View All Collection <MoveRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}