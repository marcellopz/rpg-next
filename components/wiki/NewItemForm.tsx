"use client";

import { useState, useTransition } from "react";
import { Button, TextField } from "@/components/ui";

// Dashed "New …" button that expands into a small inline name form.
// Used for creating categories and pages in the wiki sidebar.
export function NewItemForm({
  label,
  placeholder,
  maxLength,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  maxLength: number;
  /** Returns an error message to show, or null on success. */
  onSubmit: (name: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setName("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const err = await onSubmit(name.trim());
      if (err) {
        setError(err);
        return;
      }
      close();
    });
  }

  if (!open) {
    // Bespoke dashed affordance — intentionally not a ui/Button variant.
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        {label}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-300 bg-white p-2"
    >
      <TextField
        autoFocus
        value={name}
        maxLength={maxLength}
        placeholder={placeholder}
        error={error}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      />
      <div className="mt-2 flex justify-end gap-1.5">
        <Button
          variant="secondary"
          size="xs"
          onClick={close}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" size="xs" disabled={isPending || !name.trim()}>
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
    </form>
  );
}
