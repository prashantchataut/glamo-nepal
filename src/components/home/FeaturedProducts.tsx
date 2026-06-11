import { ProductCard } from "@/components/product/ProductCard";
import { getServerFeaturedProducts } from "@/lib/server/catalog";
import { Section } from "@/components/common/Section";

export async function FeaturedProducts() {
  const products = await getServerFeaturedProducts(4);
  return (
    <Section
      heading="What's New"
      cta={{ label: "View All", href: "/collections/new-arrivals" }}
    >
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {products.map((product, i) => (
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