import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[13px] font-semibold tracking-[0.14em] uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-white shadow-[0_18px_38px_-26px_rgba(26,15,11,0.58)] hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-[0_20px_44px_-24px_rgba(168,77,94,0.48)]",
        secondary:
          "border border-cream-200 bg-cream-50 text-ink shadow-[0_14px_38px_-30px_rgba(26,15,11,0.36)] hover:-translate-y-0.5 hover:border-brand-rose/45 hover:bg-white hover:text-brand-deep",
        ghost:
          "text-cream-700 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-gold after:transition-all after:duration-300",
        destructive:
          "bg-error text-white hover:bg-error/90",
        outline:
          "border border-cream-200 bg-cream-50/60 text-cream-700 hover:-translate-y-0.5 hover:border-brand-rose/40 hover:bg-white hover:text-ink",
        link:
          "text-brand-rose underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-10 px-5 py-2 text-[11px]",
        lg: "h-14 px-10 py-4 text-[14px]",
        icon: "h-11 w-11 rounded-full",
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