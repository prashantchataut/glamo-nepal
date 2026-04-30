import { Suspense } from "react";
import BlogListClient from "./BlogListClient";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Blog",
  description: "Beauty tips, skincare routines and Nepal beauty insights from GLAMO NEPAL.",
  path: "/blog",
  keywords: ["beauty blog Nepal", "skincare tips Kathmandu", "GLAMO NEPAL blog"],
});

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-bgLight py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="skeleton-shimmer h-12 w-64 rounded-xl" />
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-shimmer h-80 rounded-[2rem]" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BlogListClient />
    </Suspense>
  );
}