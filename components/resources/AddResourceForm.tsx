"use client";

import { useState } from "react";
import { addResourceItem } from "@/app/actions/resources";
import { Button, TextField } from "@/components/ui";
import { appendItem, tempId } from "@/lib/resources/optimistic";
import { useResources } from "./ResourcesContext";

export function AddResourceForm({ cardId }: { cardId: string }) {
  const { run } = useResources();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("0");
  const [total, setTotal] = useState("1");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCurrent("0");
    setTotal("1");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const currentValue = Number(current) || 0;
    const totalValue = Number(total) || 1;
    const trimmed = name.trim();

    // The row shows immediately under a placeholder id; reconcile swaps in the
    // server's real row (and its generated id / sort_order) once the insert lands.
    const optimisticId = tempId();
    const pendingName = trimmed;

    setOpen(false);
    reset();

    const result = await run(
      (d) =>
        appendItem(d, cardId, {
          id: optimisticId,
          name: pendingName,
          currentValue,
          totalValue,
          sortOrder: Number.MAX_SAFE_INTEGER,
        }),
      () =>
        addResourceItem({
          cardId,
          name: pendingName,
          currentValue,
          totalValue,
        }),
      { reconcile: true, silent: true }
    );

    if (!result.ok) {
      // Re-open with the values so the entry isn't lost.
      setName(pendingName);
      setCurrent(String(currentValue));
      setTotal(String(totalValue));
      setError(result.error);
      setOpen(true);
    }
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
        >
          Cancel
        </Button>
        <Button type="submit" size="xs" disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}
