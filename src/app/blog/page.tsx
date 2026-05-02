import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/data/blog";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Blog — Skincare Tips, Makeup Tutorials & Nepal Beauty",
  description: "Expert skincare routines, makeup tips, beauty gift guides and Nepal-focused beauty advice from GLAMO NEPAL.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-brand-bgLight">
      <div className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_50%,#F7F1EA_100%)] py-14 md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <span className="mb-6 inline-block rounded-full bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary ring-1 ring-brand-primary/10">
            Beauty Journal
          </span>
          <h1 className="font-serif text-4xl font-semibold text-brand-textPrimary md:text-6xl">
            Glow Tips & <span className="italic text-brand-primary">Beauty Secrets</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-textMuted">
            Expert advice, tutorials and ingredient guides for building better routines.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {BLOG_POSTS.map((post) => (
            <article key={post.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 border border-border/30 hover:-translate-y-1">
              <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-brand-primary text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-sm">
                  {post.category}
                </span>
              </Link>
              <div className="p-6 md:p-8">
                <h3 className="font-serif text-xl font-semibold text-brand-textPrimary mb-3 line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-brand-textMuted text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-brand-bgLight">
                    <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="32px" />
                  </div>
                  <div className="text-xs text-brand-textMuted">
                    <span className="font-medium text-brand-textPrimary">{post.author.name}</span> · {post.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}