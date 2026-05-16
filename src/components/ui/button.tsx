import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-[13px] font-semibold tracking-[0.16em] uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-white hover:bg-brand-rose",
        secondary:
          "border border-cream-200 bg-cream-50 text-ink hover:border-brand-rose hover:text-brand-rose",
        ghost:
          "text-cream-700 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-gold after:transition-all after:duration-300",
        destructive:
          "bg-error text-white hover:bg-error/90",
        outline:
          "border border-cream-200 bg-transparent text-cream-700 hover:border-cream-400 hover:text-ink",
        link:
          "text-brand-rose underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-8 py-3",
        sm: "h-9 px-5 py-2 text-[11px]",
        lg: "h-12 px-10 py-4 text-[14px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };