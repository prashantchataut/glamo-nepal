import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function EditorialHero({
  title,
  description,
  image,
  imageAlt,
  cta,
}: {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <section className="border-b border-neutral-200 bg-neutral-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <h1 className="max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 md:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 md:text-lg">
            {description}
          </p>
          {cta ? (
            <Link
              href={cta.href}
              className="mt-8 inline-flex min-h-11 items-center gap-2 bg-neutral-900 px-7 py-3 text-sm font-semibold text-neutral-50 transition-colors hover:bg-primary"
            >
              {cta.label} <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
        {image ? (
          <div className="relative min-h-[360px] overflow-hidden border border-neutral-200 bg-white shadow-editorial md:min-h-[500px]">
            <Image src={image} alt={imageAlt || title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 48vw" priority />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function EditorialSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-neutral-50 py-12 md:py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="font-display text-4xl font-medium leading-tight text-neutral-900 md:text-5xl">{title}</h2>
          {description ? <p className="mt-4 text-base leading-7 text-neutral-600">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function InfoCard({ title, body, href }: { title: string; body: string; href?: string }) {
  const content = (
    <div className="h-full border border-neutral-200 bg-white p-6 transition-colors hover:border-primary/30 md:p-7">
      <h3 className="font-display text-2xl font-medium leading-tight text-neutral-900">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-neutral-600">{body}</p>
      {href ? <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-text">Explore <ArrowRight size={14} /></span> : null}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}
