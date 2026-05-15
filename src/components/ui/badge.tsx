import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-[10px] font-medium tracking-[0.1em] uppercase select-none",
  {
    variants: {
      variant: {
        new: "bg-primary text-white",
        sale: "bg-secondary text-white",
        soldOut: "bg-neutral-400 text-white",
        default: "bg-primary text-white",
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