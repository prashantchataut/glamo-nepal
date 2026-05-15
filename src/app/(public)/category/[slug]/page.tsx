import { Suspense } from "react";
import { notFound } from "next/navigation";
import CategoryPageContent from "./CategoryPageContent";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((item) => item.slug === params.slug);
  return createMetadata({
    title: category?.seoTitle || (category ? `${category.name} Products` : "Category"),
    description: category?.seoDescription || category?.description || "Explore GLAMO NEPAL beauty category products.",
    path: `/category/${params.slug}`,
    image: category?.image,
    keywords: category ? [category.name, `${category.name} Nepal`, "beauty Nepal", "GLAMO NEPAL"] : ["GLAMO NEPAL"],
  });
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((item) => item.slug === params.slug);
  if (!category) notFound();
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Shop", path: "/shop" },
        { name: category.name, path: `/category/${category.slug}` },
      ])} />
      <CategoryPageContent />
    </Suspense>
  );
}