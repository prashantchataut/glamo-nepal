import { Suspense } from "react";
import { notFound } from "next/navigation";
import CategoryPageContent from "./CategoryPageContent";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata, breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { getServerProductsByCategory } from "@/lib/server/catalog";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = CATEGORIES.find((item) => item.slug === slug);
  return createMetadata({
    title: category?.seoTitle || (category ? `${category.name} Products` : "Category"),
    description: category?.seoDescription || category?.description || "Explore GLAMO NEPAL beauty category products.",
    path: `/category/${slug}`,
    image: category?.image,
    keywords: category ? [category.name, `${category.name} Nepal`, "beauty Nepal", "GLAMO NEPAL"] : ["GLAMO NEPAL"],
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = CATEGORIES.find((item) => item.slug === slug);
  if (!category) notFound();
  const products = await getServerProductsByCategory(slug);
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/category/${category.slug}` },
        ]),
        itemListJsonLd(products.map((product) => ({
          name: product.name,
          url: `/product/${product.slug}`,
          image: product.image,
        }))),
      ]} />
      <CategoryPageContent initialProducts={products} />
    </Suspense>
  );
}