"use client";

import { useState, type DragEvent } from "react";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import {
  deleteResourceItem,
  setResourceCurrent,
  updateResourceItem,
} from "@/app/actions/resources";
import type { ResourceItem } from "@/lib/resources/types";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { patchItem, removeItem } from "@/lib/resources/optimistic";
import { useResources } from "./ResourcesContext";

export function ResourceItemRow({
  item,
  isEditing,
  readOnly,
  dragging,
  dropIndicator,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  item: ResourceItem;
  isEditing: boolean;
  readOnly?: boolean;
  dragging?: boolean;
  dropIndicator?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent) => void;
}) {
  const { run } = useResources();
  const [name, setName] = useState(item.name);
  const [current, setCurrent] = useState(String(item.currentValue));
  const [total, setTotal] = useState(String(item.totalValue));

  function adjustCurrent(delta: number) {
    const next = Math.max(0, Math.min(item.totalValue, item.currentValue + delta));
    if (next === item.currentValue) return;
    void run(
      (d) => patchItem(d, item.id, { currentValue: next }),
      () => setResourceCurrent({ itemId: item.id, currentValue: next })
    );
  }

  function commitField(field: "name" | "current" | "total") {
    if (field === "name") {
      const trimmed = name.trim();
      if (!trimmed || trimmed === item.name) return;
      void run(
        (d) => patchItem(d, item.id, { name: trimmed }),
        () => updateResourceItem({ itemId: item.id, name: trimmed })
      );
      return;
    }

    if (field === "current") {
      const value = Number(current);
      if (!Number.isFinite(value) || value === item.currentValue) return;
      void run(
        (d) => patchItem(d, item.id, { currentValue: value }),
        () => updateResourceItem({ itemId: item.id, currentValue: value })
      );
      return;
    }

    const value = Number(total);
    if (!Number.isFinite(value) || value === item.totalValue) return;
    void run(
      (d) => patchItem(d, item.id, { totalValue: value }),
      () => updateResourceItem({ itemId: item.id, totalValue: value })
    );
  }

  function handleDelete() {
    void run(
      (d) => removeItem(d, item.id),
      () => deleteResourceItem(item.id)
    );
  }

  if (isEditing) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm",
          dropIndicator && "ring-2 ring-accent-400",
          dragging && "opacity-40"
        )}
      >
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            onDragStart?.();
          }}
          onDragEnd={onDragEnd}
          aria-label={`Reorder ${item.name}`}
          className="flex shrink-0 cursor-grab items-center text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <input
          type="number"
          min={0}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          onBlur={() => commitField("current")}
          onKeyDown={(e) => e.key === "Enter" && commitField("current")}
          className="w-10 rounded border border-gray-300 px-1 py-0.5 text-center"
          aria-label={`Current value for ${item.name}`}
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
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commitField("name")}
          onKeyDown={(e) => e.key === "Enter" && commitField("name")}
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-0.5"
          aria-label="Resource name"
        />
        <IconButton
          aria-label={`Delete ${item.name}`}
          onClick={handleDelete}
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
          disabled={readOnly || item.currentValue <= 0}
        >
          <Minus className="h-3.5 w-3.5" />
        </IconButton>
        <span className="w-6 text-center font-medium tabular-nums">
          {item.currentValue}
        </span>
        <IconButton
          aria-label={`Increase ${item.name}`}
          onClick={() => adjustCurrent(1)}
          disabled={readOnly || item.currentValue >= item.totalValue}
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
