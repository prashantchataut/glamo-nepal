import { ProductCard } from "@/components/product/ProductCard";
import { PRODUCTS } from "@/lib/data/products";
import { Section } from "@/components/common/Section";

const BEST_SELLERS = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4);

export function BestSellers() {
  return (
    <Section
      label="Best sellers"
      heading="Most loved, less loudly sold"
      subheading="Products stay minimal and image-first. No crowded add-to-cart blocks, no visual shouting."
      cta={{ label: "View all", href: "/collections/best-sellers" }}
      className="bg-cream-50"
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-6 lg:grid-cols-4">
        {BEST_SELLERS.map((product, i) => (
          <div
            key={product.id}
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </Section>
  );
}
