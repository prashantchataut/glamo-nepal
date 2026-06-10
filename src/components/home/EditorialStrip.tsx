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
        <div className="mb-10 max-w-2xl">
          <p className="type-label text-primary">The edit</p>
          <h2 id="editorial-strip-heading" className="mt-3 font-display text-5xl font-light text-neutral-900 md:text-6xl">Beauty stories worth shopping.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EDITORIAL_ITEMS.map((item) => (
            <Link key={item.title} href={item.href} className="group block border border-neutral-200 bg-neutral-100">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <p className="type-label text-primary">{item.kicker}</p>
                <h3 className="mt-2 font-display text-3xl leading-tight text-neutral-900">{item.title}</h3>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-600 group-hover:text-primary">Explore collection</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
