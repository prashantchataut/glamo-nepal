import Image from "next/image";
import { SITE_CONFIG } from "@/lib/config";
import { INSTAGRAM_POSTS } from "@/lib/constants";
import { InstagramIcon } from "@/components/ui/illustrations/SocialIcons";

export function InstagramGallery() {
  return (
    <section aria-labelledby="instagram-heading" className="overflow-hidden bg-white py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6 mb-8 md:mb-10 text-center">
        <h2 id="instagram-heading" className="font-display text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">Follow our glow journey</h2>
        <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-primary"><InstagramIcon size={16} /> {SITE_CONFIG.instagramHandle}</a>
      </div>
      <div role="region" aria-label="Instagram photo gallery" tabIndex={0} className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto">
        {INSTAGRAM_POSTS.map((post) => (
          <a key={post.id} href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square w-[50vw] flex-shrink-0 snap-start overflow-hidden bg-neutral-50 sm:w-[33vw] md:w-[25vw] lg:w-[16.666vw] cursor-pointer">
            <Image src={post.image} alt={post.caption || "GLAMO Instagram post"} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 60vw, 25vw" loading="lazy" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <InstagramIcon size={28} className="text-neutral-50 scale-75 transition-transform duration-300 group-hover:scale-100" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}