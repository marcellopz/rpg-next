"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export type MenuEntry = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

// Icon-triggered dropdown menu. Closes on outside click, Escape, or selection.
export function Menu({
  label,
  entries,
  icon: Icon = MoreHorizontal,
}: {
  /** Accessible name for the trigger button. */
  label: string;
  entries: MenuEntry[];
  icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        aria-label={label}
        aria-expanded={open}
        active={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Icon className="h-4 w-4" />
      </IconButton>

      {open && (
        <div className="absolute right-0 top-7 z-20 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {entries.map((entry) => (
            <button
              key={entry.label}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                entry.onSelect();
              }}
              className={cn(
                "block w-full px-3 py-1.5 text-left text-sm",
                entry.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
