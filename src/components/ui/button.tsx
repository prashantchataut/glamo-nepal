import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-[0.1em] uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-dark",
        secondary:
          "border border-secondary text-secondary hover:bg-secondary hover:text-white",
        ghost:
          "text-neutral-700 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-secondary after:transition-all after:duration-300",
        destructive:
          "bg-error text-white hover:bg-error/90",
        outline:
          "border border-neutral-200 bg-transparent text-neutral-700 hover:border-neutral-400 hover:text-neutral-900",
        link:
          "text-primary underline-offset-4 hover:underline",
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