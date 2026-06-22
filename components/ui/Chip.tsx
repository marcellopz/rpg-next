import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipVariant = "neutral" | "accent" | "onDark" | "onDarkSolid";

const VARIANTS: Record<ChipVariant, string> = {
  neutral: "bg-gray-100 text-gray-600",
  accent: "bg-accent-50 text-accent-700",
  // Translucent fills for sitting on top of a dark/accent surface.
  onDark: "bg-white/15 text-white",
  onDarkSolid: "bg-black/30 text-white",
};

export function Chip({
  variant = "neutral",
  className,
  children,
}: {
  variant?: ChipVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
