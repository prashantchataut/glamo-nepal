import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "article" | "section";
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, as: Tag = "div", hover = false, children, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(
          "bg-surface border border-cream-200 transition-all duration-300",
          hover && "hover:border-cream-400 hover:shadow-card-hover hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
Card.displayName = "Card";

interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "3/4" | "1/1" | "4/3" | "16/9";
}

const CardImage = React.forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, aspectRatio = "3/4", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden bg-cream-100",
          aspectRatio === "3/4" && "aspect-[3/4]",
          aspectRatio === "1/1" && "aspect-square",
          aspectRatio === "4/3" && "aspect-[4/3]",
          aspectRatio === "16/9" && "aspect-video",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CardImage.displayName = "CardImage";

const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-0 pt-3 pb-4", className)}
    {...props}
  />
));
CardBody.displayName = "CardBody";

export { Card, CardImage, CardBody };