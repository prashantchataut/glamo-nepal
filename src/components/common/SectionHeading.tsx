import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  accentText?: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  action?: ReactNode;
}

export function SectionHeading({
  title,
  accentText,
  subtitle,
  align = "left",
  className,
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" ? "text-center" : "flex flex-col md:flex-row md:items-end justify-between gap-6",
        className
      )}
    >
      <div className={cn(align === "center" && "max-w-2xl mx-auto")}>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-neutral-900">
          {title}{" "}
          {accentText && <span className="text-primary italic">{accentText}</span>}
        </h2>
        {subtitle && (
          <p className="text-neutral-500 text-lg mt-4">{subtitle}</p>
        )}
      </div>
      {action && align === "left" && <div className="shrink-0">{action}</div>}
    </div>
  );
}