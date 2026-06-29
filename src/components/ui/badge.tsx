import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-[0.1em] uppercase select-none",
  {
    variants: {
      variant: {
        new: "bg-primary text-neutral-50",
        sale: "bg-secondary text-neutral-50",
        soldOut: "bg-neutral-400 text-neutral-50",
        default: "bg-primary text-neutral-50",
        outline: "border border-neutral-200 text-neutral-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };