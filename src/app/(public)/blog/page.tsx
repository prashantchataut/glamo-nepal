import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { BlogPreview } from "@/components/home/BlogPreview";

export const revalidate = 600;

export const metadata = createMetadata({
  title: "Blog — GLAMO NEPAL",
  description: "Beauty tips, skincare routines and Nepal beauty advice from GLAMO NEPAL.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <BlogPreview />
    </>
  );
}