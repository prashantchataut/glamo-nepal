import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";
import { BLOG_CATEGORIES } from "@/lib/data/blog";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { Clock } from "lucide-react";

export const metadata = createMetadata({
  title: "Blog — GLAMO NEPAL",
  description: "Beauty tips, skincare routines, makeup guides and Nepal beauty advice from GLAMO NEPAL.",
  path: "/blog",
});

export default async function BlogPage() {
  const { posts } = await getBlogPosts();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "GLAMO NEPAL Blog",
    description: "Beauty tips, skincare routines, makeup guides and Nepal beauty advice from GLAMO NEPAL.",
    url: absoluteUrl("/blog"),
  };

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={[blogJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])]} />
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="container mx-auto px-4 md:px-6">
          <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">GLAMO NEPAL Blog</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-brand-textPrimary md:text-7xl">Beauty &amp; Wellness</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-brand-textMuted">Skincare routines, makeup tips and Nepal beauty advice curated by GLAMO NEPAL.</p>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Blog categories">
            {BLOG_CATEGORIES.map((cat) => (
              <span key={cat} className="rounded-full border border-brand-border bg-white px-4 py-1.5 text-sm font-semibold text-brand-textMuted transition hover:border-brand-primary hover:text-brand-primary">
                {cat}
              </span>
            ))}
          </nav>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-sm transition hover:shadow-md">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={post.image} alt={post.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-brand-primary">{post.category}</span>
                  <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-brand-textPrimary transition group-hover:text-brand-primary">{post.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-brand-textMuted line-clamp-2">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-brand-textMuted">
                    <span>{post.author.name}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-brand-secondary/50 bg-white p-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-brand-textPrimary">No posts yet</h2>
            <p className="mt-2 text-brand-textMuted">Check back soon for beauty tips and guides from GLAMO NEPAL.</p>
          </div>
        )}
      </section>
    </main>
  );
}