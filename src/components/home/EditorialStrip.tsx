import Image from "next/image";
import Link from "next/link";

const EDITORIAL_ITEMS = [
  {
    title: "Skincare",
    href: "/shop?category=skincare",
    image: "/images/editorial/shop-collage.svg",
  },
  {
    title: "Makeup",
    href: "/shop?category=makeup",
    image: "/images/editorial/hero-editorial.svg",
  },
  {
    title: "Body & Wellness",
    href: "/shop?category=bodycare",
    image: "/images/editorial/new-year-editorial.svg",
  },
];

export function EditorialStrip() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-0">
      {EDITORIAL_ITEMS.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="group relative aspect-[4/5] md:aspect-square overflow-hidden cursor-pointer"
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <span className="type-label text-[10px] text-white/70">
              {item.title}
            </span>
          </div>
          <div className="absolute top-6 right-6">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </Link>
      ))}
    </section>
  );
}