import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-[10px] font-medium tracking-[0.1em] uppercase select-none",
  {
    variants: {
      variant: {
        new: "bg-brand-rose text-white",
        sale: "bg-gold text-white",
        soldOut: "bg-neutral-400 text-white",
        default: "bg-brand-rose text-white",
        outline: "border border-cream-200 text-cream-700",
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