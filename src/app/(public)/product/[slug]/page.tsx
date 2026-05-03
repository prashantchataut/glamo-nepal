import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRODUCTS, getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { breadcrumbJsonLd, createMetadata, productJsonLd } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  return createMetadata({
    title: product?.name || "Product Not Found",
    description: product?.description || "GLAMO NEPAL product detail page.",
    path: `/product/${params.slug}`,
    image: product?.image,
    keywords: product ? [product.brand, product.category, product.sku, ...product.concernTags] : [],
  });
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  const related = getRelatedProducts(product, 4);

  return (
    <>
      <JsonLd data={[productJsonLd(product), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: product.name, path: `/product/${product.slug}` }])]} />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
