"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { IconButton, Typography } from "@/components/ui";

export function CombatNestedDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        data-combat-nested-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <Typography variant="h3" as="h2" id={titleId}>
            {title}
          </Typography>
          <IconButton
            aria-label="Close dialog"
            className="h-8 w-8 rounded-md"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </IconButton>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
