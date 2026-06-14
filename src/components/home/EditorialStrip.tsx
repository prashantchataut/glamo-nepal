import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/image-library";

const EDITORIAL_ITEMS = [
  { title: "The Clean Skin Shelf", href: "/shop?category=skincare", image: IMAGES.editorial.lookbook1, kicker: "Skincare" },
  { title: "Soft Color for Everyday", href: "/shop?category=makeup", image: IMAGES.editorial.lookbook2, kicker: "Makeup" },
  { title: "Weekend Body Rituals", href: "/shop?category=bodycare", image: IMAGES.editorial.lookbook3, kicker: "Body" },
];

export function EditorialStrip() {
  return (
    <section className="bg-white section-padding" aria-labelledby="editorial-strip-heading">
      <div className="mx-auto max-w-7xl page-padding">
        <div className="mb-8 md:mb-12 max-w-2xl">
          <h2 id="editorial-strip-heading" className="type-display-md font-semibold tracking-[-0.035em] text-neutral-950 md:type-display-lg">Beauty stories worth shopping.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EDITORIAL_ITEMS.map((item) => (
            <Link key={item.title} href={item.href} className="group block overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/25">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
              </div>
              <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
                <p className="type-label text-primary">{item.kicker}</p>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-tight tracking-[-0.01em] text-neutral-900 transition-colors group-hover:text-primary sm:text-2xl">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
