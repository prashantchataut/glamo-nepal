import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-brand-border bg-[var(--gradient-editorial)] py-12 md:py-16">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-brand-secondary/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-brand-gold/15 blur-3xl" />
      <div className="container relative mx-auto px-4 text-center md:px-6">
        {eyebrow ? <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">{eyebrow}</p> : null}
        <h1 className="mx-auto mt-3 max-w-4xl font-display text-4xl font-semibold leading-[0.98] text-brand-textPrimary md:text-6xl">{title}</h1>
        {description ? <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-brand-textMuted md:text-base">{description}</p> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
