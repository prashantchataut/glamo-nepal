import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-brand-bgDark py-14 text-white md:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,160,215,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(201,168,76,0.18),transparent_34%)]" />
      <div className="container relative mx-auto px-4 text-center md:px-6">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">{eyebrow}</p> : null}
        <h1 className="mt-3 font-serif text-3xl font-semibold md:text-5xl">{title}</h1>
        {description ? <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/72 md:text-base">{description}</p> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
