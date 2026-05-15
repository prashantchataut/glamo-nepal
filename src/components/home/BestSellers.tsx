import { ProductCard } from "@/components/product/ProductCard";
import { PRODUCTS } from "@/lib/mock/products";
import { Section } from "@/components/common/Section";

const BEST_SELLERS = PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4);

export function BestSellers() {
  return (
    <Section
      label="Best Sellers"
      heading="Most Loved"
      cta={{ label: "View All", href: "/collections/best-sellers" }}
    >
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {BEST_SELLERS.map((product, i) => (
          <div
            key={product.id}
            className="opacity-0 animate-fade-in-up"
            style={{
              animationDelay: `${i * 60}ms`,
              animationFillMode: "forwards",
            }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </Section>
  );
}