import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface SectionProps {
  heading: string;
  subheading?: string;
  cta?: { label: string; href: string };
  align?: "left" | "center";
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({
  heading,
  subheading,
  cta,
  align = "center",
  children,
  className,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("section-padding page-padding", className)}
    >
      <div className="mx-auto max-w-7xl">
        <div
          className={cn(
            "mb-10",
            align === "center" && "text-center",
            align === "left" && "flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          )}
        >
          <div className={cn(align === "center" && "max-w-2xl mx-auto")}>
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-neutral-950 md:text-5xl">{heading}</h2>
            {subheading && (
              <p className={cn("mt-4 max-w-xl text-[0.9375rem] leading-[1.7] text-neutral-500", align === "center" && "mx-auto")}>
                {subheading}
              </p>
            )}
          </div>
          {cta && (
            <a
              href={cta.href}
              className={cn(
                "type-nav inline-flex items-center gap-2 text-neutral-700 hover:text-primary transition-colors shrink-0",
                align === "center" && "mt-4"
              )}
            >
              {cta.label}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}