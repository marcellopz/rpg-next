"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Click-to-edit field: renders the value as a button; clicking swaps in an
// input. Enter or blur commits, Escape cancels.
export function InlineEdit({
  value,
  ariaLabel,
  type = "text",
  displayClassName,
  inputClassName,
  onCommit,
}: {
  value: string;
  ariaLabel: string;
  type?: "text" | "number";
  displayClassName?: string;
  inputClassName?: string;
  onCommit: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Distinguish Escape-initiated blur (cancel) from commit-on-blur.
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function startEditing() {
    setDraft(value);
    cancelledRef.current = false;
    setEditing(true);
  }

  async function commit() {
    if (cancelledRef.current) return;
    const next = draft.trim();
    if (next === value || next === "") {
      setEditing(false);
      return;
    }
    setBusy(true);
    await onCommit(next);
    setBusy(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={`Edit ${ariaLabel}`}
        onClick={startEditing}
        className={cn(
          "cursor-pointer rounded px-1 text-left hover:bg-accent-50 hover:text-accent-700",
          displayClassName
        )}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      aria-label={ariaLabel}
      value={draft}
      disabled={busy}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? "any" : undefined}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void commit();
        } else if (e.key === "Escape") {
          cancelledRef.current = true;
          setEditing(false);
        }
      }}
      onBlur={() => void commit()}
      className={cn(
        "w-full rounded border border-accent-400 bg-white px-1 py-0 text-inherit focus:outline-none disabled:opacity-50",
        inputClassName
      )}
    />
  );
}
