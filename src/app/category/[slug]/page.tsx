import { Suspense } from "react";
import CategoryPageContent from "./CategoryPageContent";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const category = CATEGORIES.find((item) => item.slug === params.slug);
  return createMetadata({
    title: category ? `${category.name} Products` : "Category",
    description: category?.description || "Explore GLAMO NEPAL beauty category products.",
    path: `/category/${params.slug}`,
    image: category?.image,
  });
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <CategoryPageContent />
    </Suspense>
  );
}
