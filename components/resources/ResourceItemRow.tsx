"use client";

import { useEffect, useState, type DragEvent } from "react";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import {
  deleteResourceItem,
  setResourceCurrent,
  updateResourceItem,
} from "@/app/actions/resources";
import type { ResourceItem } from "@/lib/resources/types";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/context";
import { patchItem, removeItem } from "@/lib/resources/optimistic";
import { useResources } from "./ResourcesContext";

const MAX_TILE_COUNT = 18;

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
  const { t } = useI18n();
  const { run } = useResources();
  const [name, setName] = useState(item.name);
  const [current, setCurrent] = useState(String(item.currentValue));
  const [total, setTotal] = useState(String(item.totalValue));

  useEffect(() => setName(item.name), [item.name]);
  useEffect(() => setCurrent(String(item.currentValue)), [item.currentValue]);
  useEffect(() => setTotal(String(item.totalValue)), [item.totalValue]);

  function adjustCurrent(delta: number) {
    const next = Math.max(0, Math.min(item.totalValue, item.currentValue + delta));
    setCurrentValue(next);
  }

  function setCurrentValue(next: number) {
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

  const usesTiles = item.totalValue <= MAX_TILE_COUNT;

  return (
    <div className="px-1 py-1.5 text-xs">
      <div className="flex min-w-0 items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-medium text-gray-800">
          {item.name}
        </span>
        <span className="shrink-0 text-[0.65rem] tabular-nums text-gray-500">
          {t("resources.remainingCount", {
            current: item.currentValue,
            total: item.totalValue,
          })}
        </span>
      </div>

      {usesTiles ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {Array.from({ length: item.totalValue }, (_, index) => {
            const value = index + 1;
            const active = value <= item.currentValue;
            const nextValue =
              value === item.currentValue ? item.currentValue - 1 : value;
            return (
              <button
                key={value}
                type="button"
                disabled={readOnly}
                onClick={() => setCurrentValue(nextValue)}
                aria-label={t("resources.setRemaining", {
                  name: item.name,
                  count: nextValue,
                })}
                aria-pressed={active}
                className={cn(
                  "h-5 min-w-5 flex-1 rounded border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-default",
                  active
                    ? "resource-use-tile-active"
                    : "border-gray-200 bg-gray-100 hover:bg-gray-200",
                  readOnly && "opacity-75"
                )}
              >
                <span className="sr-only">{value}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-1">
          <IconButton
            aria-label={`Decrease ${item.name}`}
            onClick={() => adjustCurrent(-1)}
            disabled={readOnly || item.currentValue <= 0}
          >
            <Minus className="h-3.5 w-3.5" />
          </IconButton>
          <span className="resource-current-value w-12 text-center font-medium tabular-nums">
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
      )}
    </div>
  );
}
