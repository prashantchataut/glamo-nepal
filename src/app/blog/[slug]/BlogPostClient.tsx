"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBlogBySlug, getRelatedPosts } from "@/lib/data/blog";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [readingProgress, setReadingProgress] = useState(0);
  const post = getBlogBySlug(params.slug);
  const related = getRelatedPosts(params.slug, 3);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setReadingProgress(Math.min(progress, 100));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!post) {
    return (
      <div className="min-h-screen bg-brand-bgLight flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-semibold mb-4">Post Not Found</h1>
          <Link href="/blog" className="px-8 py-3 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-colors">Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border/30">
        <div className="h-full bg-brand-primary transition-all duration-150" style={{ width: `${readingProgress}%` }} />
      </div>

      <div className="relative h-[40vh] md:h-[50vh] bg-brand-bgDark overflow-hidden">
        <Image src={post.image} alt={post.title} fill className="object-cover opacity-50" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bgDark via-brand-bgDark/60 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 md:px-6 h-full flex flex-col justify-end pb-10 md:pb-16">
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft size={16} strokeWidth={1.5} /> Back to Blog
          </Link>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.15em] rounded-full mb-4 w-fit">{post.category}</span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight max-w-3xl">{post.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/30">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-bgLight shrink-0">
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <p className="font-semibold text-brand-textPrimary">{post.author.name}</p>
            <p className="text-sm text-brand-textMuted">{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {post.readTime}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-textPrimary prose-p:text-brand-textMuted prose-a:text-brand-primary" dangerouslySetInnerHTML={{ __html: post.content }} />

          <div className="mt-12 pt-8 border-t border-border/30">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-brand-bgLight shrink-0">
                <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="64px" />
              </div>
              <div>
                <p className="font-serif text-xl font-semibold text-brand-textPrimary">{post.author.name}</p>
                <p className="text-sm text-brand-textMuted">Beauty writer at GLAMO Nepal</p>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary mb-8 text-center">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-border/30 hover:shadow-md transition-all">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={r.image} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-semibold text-brand-textPrimary group-hover:text-brand-primary transition-colors line-clamp-2">{r.title}</h3>
                    <p className="text-xs text-brand-textMuted mt-2">{r.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}