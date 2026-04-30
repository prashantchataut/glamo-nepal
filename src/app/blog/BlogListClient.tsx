"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/mock/blog";
import { cn } from "@/lib/utils";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? BLOG_POSTS : BLOG_POSTS.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="bg-brand-bgDark text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6 border border-white/10">Beauty Journal</span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mb-4">Glow Tips & <span className="text-brand-secondary italic">Beauty Secrets</span></h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">Expert advice, tutorials, and deep-dives into the ingredients that transform your skin.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-10">
          {BLOG_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300", activeCategory === cat ? "bg-brand-primary text-white shadow-md" : "bg-white text-brand-textMuted border border-border hover:border-brand-primary/30 hover:text-brand-primary")}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((post) => (
            <article key={post.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(139,58,143,0.08)] transition-all duration-500 border border-border/30 hover:-translate-y-1">
              <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                <Image src={post.image} alt={post.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-brand-primary text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-sm">{post.category}</span>
              </Link>
              <div className="p-6 md:p-8">
                <h3 className="font-serif text-xl font-semibold text-brand-textPrimary mb-3 line-clamp-2 group-hover:text-brand-primary transition-colors leading-tight">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-brand-textMuted text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-brand-bgLight">
                    <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="32px" />
                  </div>
                  <div className="text-xs text-brand-textMuted">
                    <span className="font-medium text-brand-textPrimary">{post.author.name}</span> · {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {post.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}