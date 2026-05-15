import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="type-label mb-2 block text-neutral-400"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus:border-error",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };