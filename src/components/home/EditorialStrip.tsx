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
    <section className="bg-white py-16 md:py-24" aria-labelledby="editorial-strip-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-12 max-w-2xl">
          <h2 id="editorial-strip-heading" className="font-display text-4xl font-semibold leading-[0.95] tracking-[-0.035em] text-neutral-950 md:text-5xl">Beauty stories worth shopping.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EDITORIAL_ITEMS.map((item) => (
            <Link key={item.title} href={item.href} className="group block overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/25">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
              </div>
              <div className="px-5 pb-5 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{item.kicker}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-[-0.01em] text-neutral-900 transition-colors group-hover:text-primary">{item.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
