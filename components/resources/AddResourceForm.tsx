"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addResourceItem } from "@/app/actions/resources";
import { Button, TextField } from "@/components/ui";

export function AddResourceForm({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("0");
  const [total, setTotal] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setCurrent("0");
    setTotal("1");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addResourceItem({
        cardId,
        name,
        currentValue: Number(current) || 0,
        totalValue: Number(total) || 1,
      });
      if (!result?.ok) {
        setError(result?.error ?? "Could not add resource. Please try again.");
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        fullWidth
        onClick={() => setOpen(true)}
      >
        Add resource
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-md border border-dashed border-gray-300 p-2">
      <TextField
        id={`resource-name-${cardId}`}
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Level 1 slots"
        maxLength={80}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2">
        <TextField
          id={`resource-current-${cardId}`}
          label="Current"
          type="number"
          min={0}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          id={`resource-total-${cardId}`}
          label="Total"
          type="number"
          min={0}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" size="xs" disabled={isPending || !name.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}
