import { ProductCard } from "@/components/product/ProductCard";
import { FEATURED_PRODUCTS } from "@/lib/constants";
import { Section } from "@/components/common/Section";

export function FeaturedProducts() {
  const products = FEATURED_PRODUCTS.slice(0, 4);
  return (
    <Section
      label="New arrivals"
      heading="The fresh shelf"
      subheading="A quieter product edit with a giant typographic backdrop, taking cues from The Act's type-as-texture approach."
      cta={{ label: "View all", href: "/collections/new-arrivals" }}
      className="relative bg-cream-100"
    >
      <div className="pointer-events-none absolute left-1/2 top-[50%] hidden -translate-x-1/2 -translate-y-1/2 select-none font-display text-[22vw] font-light leading-none tracking-[-0.08em] text-cream-200/75 md:block" aria-hidden="true">
        glamo
      </div>
      <div className="relative grid grid-cols-2 gap-x-3 gap-y-8 md:gap-6 lg:grid-cols-4">
        {products.map((product, i) => (
          <div
            key={product.id}
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </Section>
  );
}
