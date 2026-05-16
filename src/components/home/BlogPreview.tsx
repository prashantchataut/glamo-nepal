

import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { BLOG_POSTS_SYNC as BLOG_POSTS } from "@/lib/data/blog";

export function BlogPreview() {
  return (
    <section aria-labelledby="blog-preview-heading" className="py-12 md:py-16 lg:py-20 bg-brand-bgLight">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4 md:gap-6">
          <div className="max-w-2xl">
            <h2 id="blog-preview-heading" className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 md:mb-4 text-brand-textPrimary">
              Glow Tips & <span className="text-brand-primary italic">Beauty Secrets</span>
            </h2>
            <p className="text-brand-textMuted text-lg leading-relaxed">
              Expert advice, tutorials, and deep-dives into the ingredients that transform your skin.
            </p>
          </div>
          <Link href="/blog" className="group flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-bgDark transition-colors duration-300 shrink-0">
            Read All Articles
            <span className="p-2 bg-brand-primary/10 rounded-none group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
              <MoveRight size={16} />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {BLOG_POSTS.map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-cream-50 rounded-none overflow-hidden shadow-sm hover:shadow-soft transition-all duration-500 border border-border/30 hover:-translate-y-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  loading="lazy"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-4 left-4">
                  <span className="font-label bg-cream-50/90 text-brand-primary text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-none shadow-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-display text-xl md:text-2xl font-semibold text-brand-textPrimary mb-3 line-clamp-2 group-hover:text-brand-primary transition-colors duration-300 leading-tight">
                  {post.title}
                </h3>
                <p className="text-brand-textMuted leading-relaxed mb-6 line-clamp-3 text-sm">
                  {post.excerpt}
                </p>
                <span className="font-label inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-textPrimary group-hover:text-brand-primary transition-colors duration-300">
                  Read More <MoveRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}