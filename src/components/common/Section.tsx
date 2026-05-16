import { cn } from "@/lib/utils";
import Link from "next/link";
import { type ReactNode } from "react";

interface SectionProps {
  label?: string;
  heading: string;
  subheading?: string;
  cta?: { label: string; href: string };
  align?: "left" | "center";
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ label, heading, subheading, cta, align = "center", children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("section-padding page-padding", className)}>
      <div className="mx-auto max-w-[1440px]">
        <div
          className={cn(
            "mb-14 md:mb-18 lg:mb-20",
            align === "center" && "text-center",
            align === "left" && "grid gap-6 md:grid-cols-[0.32fr_0.68fr] md:items-end",
          )}
        >
          <div>
            {label && <span className="mb-4 block text-label-md font-semibold uppercase tracking-[0.12em] text-brand-rose">{label}</span>}
            <h2 className={cn("font-display text-display-lg font-light leading-[1.02] tracking-[-0.03em] text-ink", align === "center" && "mx-auto max-w-4xl")}>{heading}</h2>
          </div>
          <div className={cn(align === "center" && "mx-auto max-w-2xl", align === "left" && "md:max-w-xl md:justify-self-end")}> 
            {subheading && <p className="mt-5 text-body-md leading-8 text-cream-700">{subheading}</p>}
            {cta && (
              <Link href={cta.href} className={cn("mt-7 inline-flex items-center gap-2 text-label-md font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:text-brand-rose", align === "center" && "justify-center")}>
                {cta.label}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 13L13 3M13 3H5.5M13 3V10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
