import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons have no visible text. */
  "aria-label": string;
  /** Keeps the hover style applied, e.g. while an attached menu is open. */
  active?: boolean;
}

// Small square button that wraps a single icon.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, active, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          active && "bg-gray-200 text-gray-700",
          className
        )}
        {...props}
      />
    );
  }
);
