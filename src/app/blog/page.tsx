import BlogListClient from "@/app/blog/BlogListClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Journal",
  description: "Read GLAMO NEPAL skincare, makeup, gifting and beauty routine guides for Nepal.",
  path: "/blog",
  keywords: ["beauty blog Nepal", "skincare tips Nepal", "makeup guide Nepal"],
});

export default function BlogPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <BlogListClient />
    </>
  );
}
