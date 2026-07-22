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
// Mobile: Qty, Name, Total, Actions
// Tablet+: Qty, Name, Type, Weight, Total, Actions
export const ITEMS_GRID =
  "grid-cols-[2.5rem_minmax(0,1fr)_3.5rem_2.5rem] sm:grid-cols-[3.5rem_minmax(0,1fr)_7.5rem_5rem_5rem_2.5rem]";

export function ItemRow({
  item,
  index,
  menuEntries,
  dragging,
  dropIndicator,
  dragEnabled = true,
  readOnly,
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
  dragEnabled?: boolean;
  readOnly?: boolean;
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
      draggable={dragEnabled}
      onDragStart={(e) => {
        if (!dragEnabled) return;
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={dragEnabled ? onDragOver : undefined}
      onDragLeave={onDragLeave}
      onDrop={dragEnabled ? onDrop : undefined}
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
          readOnly={readOnly}
          onCommit={(v) => onEdit("quantity", v)}
        />
      </div>

      <div className={cn("min-w-0 truncate", textClass)}>
        <InlineEdit
          value={item.name}
          ariaLabel={item.name}
          displayClassName={textClass}
          readOnly={readOnly}
          onCommit={(v) => onEdit("name", v)}
        />
      </div>

      {/* Hidden on mobile, shown on tablet+ */}
      <select
        aria-label={t("inventory.tool")}
        value={item.itemType}
        disabled={readOnly}
        onChange={(e) => void onEdit("itemType", e.target.value)}
        className={cn(
          "hidden cursor-pointer rounded border-0 bg-transparent py-0.5 pl-0 pr-6 text-sm capitalize hover:bg-accent-50 focus:outline-none sm:block disabled:cursor-default disabled:hover:bg-transparent",
          textClass
        )}
      >
        {INVENTORY_ITEM_TYPE_LIST.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>

      {/* Hidden on mobile, shown on tablet+ */}
      <div className="hidden text-gray-600 sm:block">
        <InlineEdit
          value={formatWeight(item.weight)}
          ariaLabel={item.name}
          type="number"
          readOnly={readOnly}
          onCommit={(v) => onEdit("weight", v)}
        />
      </div>

      {/* Shown on all screens */}
      <div className="px-1 text-gray-600">
        {formatWeight(item.weight * item.quantity)}
      </div>

      <div className="justify-self-end">
        {menuEntries.length > 0 && (
          <Menu label={`Options for ${item.name}`} entries={menuEntries} />
        )}
      </div>
    </div>
  );
}
