import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// CSS-only tooltip: no client JS, so it works inside server components. Wraps a
// trigger and reveals `label` on hover or keyboard focus of the trigger.
export function Tooltip({
  label,
  children,
  side = "top",
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          className
        )}
      >
        {label}
      </span>
    </span>
  );
}
