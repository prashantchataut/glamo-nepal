import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRODUCTS, getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getProductServer, getRelatedProductsServer } from "@/lib/api/server";
import { breadcrumbJsonLd, createMetadata, productJsonLd } from "@/lib/seo";
import ProductDetailClient from "@/components/product/detail/ProductDetailClient";
import type { Product } from "@/types/product";

// Revalidate live product data periodically (ISR).
export const revalidate = 300;

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

// Prefer live catalog data; fall back to the static catalog when the
// data service is unreachable (e.g. at build time before provisioning).
async function resolveProduct(slug: string): Promise<Product | null> {
  return (await getProductServer(slug)) ?? getProductBySlug(slug) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await resolveProduct(params.slug);
  return createMetadata({
    title: product?.name || "Product Not Found",
    description: product?.description || "GLAMO NEPAL product detail page.",
    path: `/product/${params.slug}`,
    image: product?.image,
    keywords: product ? [product.brand, product.category, product.sku, ...product.concernTags] : [],
  });
}

export default async function ProductsPage({ params }: { params: { slug: string } }) {
  const product = await resolveProduct(params.slug);
  if (!product) notFound();

  const liveRelated = await getRelatedProductsServer(product.slug, 4);
  const related = liveRelated.length > 0 ? liveRelated : getRelatedProducts(product, 4);

  return (
    <>
      <JsonLd data={[productJsonLd(product), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: product.name, path: `/product/${product.slug}` }])]} />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
