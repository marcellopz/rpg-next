"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  deleteResourceItem,
  setResourceCurrent,
  updateResourceItem,
} from "@/app/actions/resources";
import type { ResourceItem } from "@/lib/resources/types";
import { IconButton } from "@/components/ui";

export function ResourceItemRow({
  item,
  isEditing,
}: {
  item: ResourceItem;
  isEditing: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(item.name);
  const [current, setCurrent] = useState(String(item.currentValue));
  const [total, setTotal] = useState(String(item.totalValue));

  function refresh() {
    router.refresh();
  }

  function adjustCurrent(delta: number) {
    const next = Math.max(0, Math.min(item.totalValue, item.currentValue + delta));
    startTransition(async () => {
      await setResourceCurrent({ itemId: item.id, currentValue: next });
      refresh();
    });
  }

  function commitField(field: "name" | "current" | "total") {
    startTransition(async () => {
      if (field === "name") {
        const trimmed = name.trim();
        if (!trimmed || trimmed === item.name) return;
        await updateResourceItem({ itemId: item.id, name: trimmed });
      } else if (field === "current") {
        const value = Number(current);
        if (!Number.isFinite(value) || value === item.currentValue) return;
        await updateResourceItem({ itemId: item.id, currentValue: value });
      } else {
        const value = Number(total);
        if (!Number.isFinite(value) || value === item.totalValue) return;
        await updateResourceItem({ itemId: item.id, totalValue: value });
      }
      refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteResourceItem(item.id);
      refresh();
    });
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm">
        <input
          type="number"
          min={0}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={() => commitField("current")}
          onKeyDown={(e) => e.key === "Enter" && commitField("current")}
          className="w-10 rounded border border-gray-300 px-1 py-0.5 text-center"
          aria-label={`Current value for ${item.name}`}
          disabled={isPending}
        />
        <span className="text-gray-400">/</span>
        <input
          type="number"
          min={0}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          onBlur={() => commitField("total")}
          onKeyDown={(e) => e.key === "Enter" && commitField("total")}
          className="w-10 rounded border border-gray-300 px-1 py-0.5 text-center"
          aria-label={`Total value for ${item.name}`}
          disabled={isPending}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commitField("name")}
          onKeyDown={(e) => e.key === "Enter" && commitField("name")}
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-0.5"
          aria-label="Resource name"
          disabled={isPending}
        />
        <IconButton
          aria-label={`Delete ${item.name}`}
          onClick={handleDelete}
          disabled={isPending}
          className="text-gray-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md px-1 py-1 text-sm">
      <div className="flex shrink-0 items-center gap-1">
        <IconButton
          aria-label={`Decrease ${item.name}`}
          onClick={() => adjustCurrent(-1)}
          disabled={isPending || item.currentValue <= 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </IconButton>
        <span className="w-6 text-center font-medium tabular-nums">
          {item.currentValue}
        </span>
        <IconButton
          aria-label={`Increase ${item.name}`}
          onClick={() => adjustCurrent(1)}
          disabled={isPending || item.currentValue >= item.totalValue}
        >
          <Plus className="h-3.5 w-3.5" />
        </IconButton>
      </div>
      <span className="text-gray-400">/</span>
      <span className="w-6 text-center tabular-nums text-gray-500">
        {item.totalValue}
      </span>
      <span className="min-w-0 truncate text-gray-800">{item.name}</span>
    </div>
  );
}
