"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export type MenuEntry = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

// Rough per-row height (text-sm + py-1.5) used to decide whether the menu
// fits below the trigger — matches the dropdown's own item styling below.
const MENU_ITEM_HEIGHT = 33;
const MENU_PADDING = 8; // the dropdown's own py-1 (top + bottom)
const VIEWPORT_MARGIN = 8;

type Position = { top?: number; bottom?: number; right: number };

// Icon-triggered dropdown menu. Closes on outside click, Escape, or selection.
// The dropdown is portaled to <body> with fixed positioning (not absolute
// inside a relative wrapper) so it never gets clipped by an ancestor's
// overflow-hidden — e.g. the rounded campaign-body card — and flips above
// the trigger automatically when there isn't room below.
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
  const [position, setPosition] = useState<Position | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = rootRef.current;
    if (!trigger) return;

    function place() {
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const estimatedHeight = entries.length * MENU_ITEM_HEIGHT + MENU_PADDING;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp =
        spaceBelow < estimatedHeight + VIEWPORT_MARGIN &&
        rect.top > estimatedHeight + VIEWPORT_MARGIN;

      setPosition({
        right: Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.right),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
    // entries.length affects the estimated height used to decide direction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entries.length]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
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

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-20 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            style={{
              top: position.top,
              bottom: position.bottom,
              right: position.right,
            }}
          >
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
          </div>,
          document.body
        )}
    </div>
  );
}
