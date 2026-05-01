"use client";

import Image from "next/image";
import { FaInstagram } from "react-icons/fa";
import { INSTAGRAM_POSTS, SITE_CONFIG } from "@/lib/constants";

export function InstagramGallery() {
  return (
    <section className="overflow-hidden bg-white py-16 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="mb-3 font-serif text-3xl font-semibold text-brand-textPrimary md:text-4xl">Follow Our <span className="italic text-brand-primary">Glow Journey</span></h2>
        <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-brand-textMuted transition-colors hover:text-brand-primary"><FaInstagram size={18} /> {SITE_CONFIG.instagramHandle}</a>
      </div>
      <div className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto">
        {INSTAGRAM_POSTS.map((post) => <a key={post.id} href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square w-[60vw] flex-shrink-0 snap-start overflow-hidden bg-brand-bgLight md:w-[25vw] lg:w-[16.666vw]"><Image src={post.image} alt={post.caption || "GLAMO Instagram post"} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 60vw, 25vw"/><div className="absolute inset-0 flex items-center justify-center bg-brand-primary/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100"><FaInstagram size={32} className="scale-50 text-white transition-transform duration-300 group-hover:scale-100"/></div></a>)}
      </div>
    </section>
  );
}