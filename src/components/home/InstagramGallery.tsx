"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import { SITE_CONFIG } from "@/lib/config";
import { INSTAGRAM_POSTS } from "@/lib/constants";

export function InstagramGallery() {
  return (
    <section className="overflow-hidden bg-white py-16 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tight text-brand-textPrimary md:text-4xl">Follow Our <span className="italic text-brand-primary">Glow Journey</span></h2>
        <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-brand-textMuted transition-colors hover:text-brand-primary cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg> {SITE_CONFIG.instagramHandle}</a>
      </div>
      <div className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto">
        {INSTAGRAM_POSTS.map((post) => <a key={post.id} href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square w-[60vw] flex-shrink-0 snap-start overflow-hidden bg-brand-bgLight md:w-[25vw] lg:w-[16.666vw] cursor-pointer"><Image src={post.image} alt={post.caption || "GLAMO Instagram post"} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 60vw, 25vw"/><div className="absolute inset-0 flex items-center justify-center bg-brand-primary/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-50 text-white transition-transform duration-300 group-hover:scale-100"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></div></a>)}
      </div>
    </section>
  );
}