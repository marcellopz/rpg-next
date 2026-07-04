"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function ToolbarButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus in the editor so the selection isn't lost on click.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors",
        active
          ? "bg-accent-100 text-accent-800"
          : "hover:bg-gray-100 hover:text-gray-900",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-gray-200" />;
}
