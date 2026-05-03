"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Share2, Copy } from "lucide-react";
import type { BlogPost } from "@/lib/data/blog";
import { SITE_CONFIG } from "@/lib/constants";

export default function BlogPostClient({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const postUrl = `${SITE_CONFIG.website}/blog/${post.slug}`;
  const shareText = `${post.title} — ${SITE_CONFIG.fullTitle}`;

  const shareLinks = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareText + " " + postUrl)}`, icon: "💬" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, icon: "📘" },
    { label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, icon: "🐦" },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setReadingProgress(Math.min(progress, 100));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-border/30">
        <div className="h-full bg-brand-primary transition-all duration-150" style={{ width: `${readingProgress}%` }} />
      </div>

      <div className="relative h-[40vh] overflow-hidden bg-brand-bgDark md:h-[50vh]">
        <Image src={post.image} alt={post.title} fill className="object-cover opacity-50" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bgDark via-brand-bgDark/60 to-transparent" />
        <div className="relative z-10 container mx-auto flex h-full flex-col justify-end px-4 pb-10 md:px-6 md:pb-16">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back to Blog
          </Link>
          <span className="mb-4 inline-block w-fit rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">{post.category}</span>
          <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">{post.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-8 flex items-center gap-4 border-b border-border/30 pb-8">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-bgLight">
            <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <p className="font-semibold text-brand-textPrimary">{post.author.name}</p>
            <p className="text-sm text-brand-textMuted">{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {post.readTime}</p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-brand-textPrimary prose-p:text-brand-textMuted prose-a:text-brand-primary" dangerouslySetInnerHTML={{ __html: post.content }} />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-brand-textMuted"><Share2 size={16} /> Share</span>
            {shareLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary">
                <span>{link.icon}</span> {link.label}
              </a>
            ))}
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary">
              <Copy size={14} /> {copied ? "Copied!" : "Copy link"}
            </button>
          </div>

          <div className="mt-12 border-t border-border/30 pt-8">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-bgLight">
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
            <h2 className="mb-8 text-center font-serif text-3xl font-semibold text-brand-textPrimary">Related Articles</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group overflow-hidden rounded-2xl border border-border/30 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={r.image} alt={r.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-serif text-lg font-semibold text-brand-textPrimary transition-colors group-hover:text-brand-primary">{r.title}</h3>
                    <p className="mt-2 text-xs text-brand-textMuted">{r.readTime}</p>
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