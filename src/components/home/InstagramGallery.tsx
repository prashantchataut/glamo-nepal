import Image from "next/image";
import { SITE_CONFIG } from "@/lib/config";
import { INSTAGRAM_POSTS } from "@/lib/constants";
import { InstagramIcon } from "@/components/ui/illustrations/SocialIcons";

export function InstagramGallery() {
  return (
    <section aria-labelledby="instagram-heading" className="overflow-hidden bg-white py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6 mb-8 md:mb-10 text-center">
        <h2 id="instagram-heading" className="mb-3 font-display text-3xl font-semibold tracking-tight text-brand-textPrimary md:text-4xl">Follow Our <span className="italic text-brand-primary">Glow Journey</span></h2>
        <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-brand-textMuted transition-colors hover:text-brand-primary cursor-pointer"><InstagramIcon size={18} /> {SITE_CONFIG.instagramHandle}</a>
      </div>
      <div role="region" aria-label="Instagram photo gallery" tabIndex={0} className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto">
        {INSTAGRAM_POSTS.map((post) => (
          <a key={post.id} href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square w-[50vw] flex-shrink-0 snap-start overflow-hidden bg-brand-bgLight sm:w-[33vw] md:w-[25vw] lg:w-[16.666vw] cursor-pointer">
            <Image src={post.image} alt={post.caption || "GLAMO Instagram post"} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 60vw, 25vw" loading="lazy" />
            <div className="absolute inset-0 flex items-center justify-center bg-brand-primary/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
              <InstagramIcon size={32} className="scale-50 text-white transition-transform duration-300 group-hover:scale-100" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}