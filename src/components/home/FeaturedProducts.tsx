import { ProductCard } from "@/components/product/ProductCard";
import { FEATURED_PRODUCTS } from "@/lib/constants";
import { Section } from "@/components/common/Section";

export function FeaturedProducts() {
  return (
    <Section
      label="New Arrivals"
      heading="What's New"
      cta={{ label: "View All", href: "/collections/new-arrivals" }}
    >
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {FEATURED_PRODUCTS.slice(0, 4).map((product, i) => (
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