import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 py-12 md:py-16">
      <div className="container relative mx-auto px-4 text-center md:px-6">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-neutral-950 md:text-6xl">{title}</h1>
        {description ? <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-neutral-500 md:text-base">{description}</p> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
