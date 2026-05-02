import { createMetadata } from "@/lib/seo";
import BlogListClient from "./BlogListClient";

export const metadata = createMetadata({
  title: "Beauty Blog — Skincare Tips, Makeup Tutorials & Nepal Beauty",
  description: "Expert skincare routines, makeup tips, beauty gift guides and Nepal-focused beauty advice from GLAMO NEPAL.",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogListClient />;
}