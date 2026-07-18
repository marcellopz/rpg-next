"use client";

import type { DragEvent } from "react";
import { Menu, type MenuEntry } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import {
  isInventoryItemType,
  INVENTORY_ITEM_TYPE_LIST,
  itemTypeTextClass,
} from "@/lib/inventory/item-types";
import type { InventoryItem } from "@/lib/queries/inventory";
import { formatWeight } from "../encumbrance";
import { InlineEdit } from "../InlineEdit";

// Shared column template so the header (ItemsTable) and rows stay aligned.
export const ITEMS_GRID =
  "grid-cols-[3.5rem_minmax(0,1fr)_7.5rem_5rem_5rem_2.5rem]";

export function ItemRow({
  item,
  index,
  menuEntries,
  dragging,
  dropIndicator,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onEdit,
}: {
  item: InventoryItem;
  index: number;
  menuEntries: MenuEntry[];
  dragging: boolean;
  dropIndicator: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onEdit: (
    field: "name" | "itemType" | "weight" | "quantity",
    value: string
  ) => Promise<void>;
}) {
  const { t } = useI18n();
  const textClass = itemTypeTextClass(item.itemType);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "group grid items-center gap-2 border-t-2 px-4 py-1.5 text-sm",
        ITEMS_GRID,
        dropIndicator ? "border-accent-400" : "border-transparent",
        dragging && "opacity-40",
        index % 2 === 1 && "bg-gray-50"
      )}
    >
      <div className="text-gray-600">
        <InlineEdit
          value={String(item.quantity)}
          ariaLabel={t("inventory.tool")}
          type="number"
          onCommit={(v) => onEdit("quantity", v)}
        />
      </div>

      <div className={cn("min-w-0 truncate", textClass)}>
        <InlineEdit
          value={item.name}
          ariaLabel={item.name}
          displayClassName={textClass}
          onCommit={(v) => onEdit("name", v)}
        />
      </div>

      <select
        aria-label={t("inventory.tool")}
        value={item.itemType}
        onChange={(e) => void onEdit("itemType", e.target.value)}
        className={cn(
          "cursor-pointer rounded border-0 bg-transparent py-0.5 pl-0 pr-6 text-sm capitalize hover:bg-accent-50 focus:outline-none",
          textClass
        )}
      >
        {INVENTORY_ITEM_TYPE_LIST.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>

      <div className="text-gray-600">
        <InlineEdit
          value={formatWeight(item.weight)}
          ariaLabel={item.name}
          type="number"
          onCommit={(v) => onEdit("weight", v)}
        />
      </div>

      <div className="px-1 text-gray-600">
        {formatWeight(item.weight * item.quantity)}
      </div>

      <div className="justify-self-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Menu label={`Options for ${item.name}`} entries={menuEntries} />
      </div>
    </div>
  );
}
