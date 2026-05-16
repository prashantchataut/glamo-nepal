import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-cream-200 bg-cream-50 py-12 md:py-16">
      <div className="container relative mx-auto px-4 text-center md:px-6">
        {eyebrow ? <p className="type-label text-xs font-bold uppercase tracking-[0.24em] text-brand-rose">{eyebrow}</p> : null}
        <h1 className="mx-auto mt-3 max-w-4xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.035em] text-ink md:text-6xl">{title}</h1>
        {description ? <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-cream-400 md:text-base">{description}</p> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
