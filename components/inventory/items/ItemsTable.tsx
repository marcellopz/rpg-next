"use client";

import { useState, type DragEvent } from "react";
import {
  deleteItem,
  reorderItems,
  transferItem,
  updateItem,
  type ItemField,
} from "@/app/actions/inventory";
import { Typography, type MenuEntry } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import type { Character, InventoryItem } from "@/lib/queries/inventory";
import * as optimistic from "@/lib/inventory/optimistic";
import { useInventory } from "../InventoryContext";
import { AddItemForm } from "./AddItemForm";
import { ItemRow, ITEMS_GRID } from "./ItemRow";
import { cn } from "@/lib/cn";

// The selected character's item list: header, draggable editable rows, and
// the add-item form. Rows can be sent to other party members via the menu.
export function ItemsTable({ character }: { character: Character }) {
  const { t } = useI18n();
  const { characters, readOnly, run } = useInventory();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | "end" | null>(null);

  const items = character.items;

  function clearDrag() {
    setDragId(null);
    setDropId(null);
  }

  function handleDragOver(e: DragEvent, targetId: string | "end") {
    if (!dragId || dragId === targetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropId(targetId);
  }

  function handleDrop(e: DragEvent, targetId: string | "end") {
    e.preventDefault();
    const sourceId = dragId;
    clearDrag();
    if (!sourceId || sourceId === targetId) return;

    const ids = items.map((i) => i.id).filter((id) => id !== sourceId);
    if (targetId === "end") {
      ids.push(sourceId);
    } else {
      const at = ids.indexOf(targetId);
      if (at === -1) return;
      ids.splice(at, 0, sourceId);
    }

    void run(
      (prev) => optimistic.reorderItems(prev, character.id, ids),
      () => reorderItems({ characterId: character.id, orderedIds: ids })
    );
  }

  async function handleEdit(
    item: InventoryItem,
    field: ItemField,
    value: string
  ): Promise<void> {
    const numeric = field === "weight" || field === "quantity";
    const parsed = numeric ? Number(value) : value;
    if (numeric && !Number.isFinite(parsed as number)) return;
    if (parsed === item[field]) return;

    await run(
      (prev) =>
        optimistic.patchItem(prev, item.id, {
          [field]: parsed,
        } as Partial<InventoryItem>),
      () => updateItem(item.id, field, parsed)
    );
  }

  function handleDelete(item: InventoryItem) {
    if (!window.confirm(`Delete "${item.name}" from ${character.name}'s inventory?`))
      return;
    void run(
      (prev) => optimistic.removeItem(prev, item.id),
      () => deleteItem(item.id)
    );
  }

  function handleTransfer(item: InventoryItem, targetId: string) {
    void run(
      (prev) => optimistic.transferItem(prev, item.id, targetId),
      () => transferItem(item.id, targetId)
    );
  }

  function menuEntries(item: InventoryItem): MenuEntry[] {
    const sendTargets: MenuEntry[] = characters
      .filter((c) => c.id !== character.id)
      .map((c) => ({
        label: `Send to ${c.name}`,
        onSelect: () => handleTransfer(item, c.id),
      }));
    return [
      ...sendTargets,
      { label: "Delete", onSelect: () => handleDelete(item), danger: true },
    ];
  }

  return (
    <div id="inventory-items" className="flex flex-1 flex-col">
      <div
        className={cn(
          "grid gap-2 border-b border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400",
          ITEMS_GRID
        )}
      >
        <span />
        <span>{t("inventory.table.qty")}</span>
        <span>{t("inventory.table.name")}</span>
        <span className="hidden sm:inline">{t("inventory.table.type")}</span>
        <span className="hidden sm:inline">{t("inventory.table.weight")}</span>
        <span>{t("inventory.table.total")}</span>
        <span />
      </div>

      <div className="flex-1">
        {items.length === 0 && (
          <Typography variant="muted" className="px-4 py-6">
            {character.name}&apos;s backpack is empty. Add the first item below.
          </Typography>
        )}

        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            menuEntries={readOnly ? [] : menuEntries(item)}
            dragging={dragId === item.id}
            dropIndicator={dropId === item.id}
            dragEnabled={!readOnly}
            readOnly={readOnly}
            onDragStart={() => setDragId(item.id)}
            onDragEnd={clearDrag}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={() =>
              setDropId((prev) => (prev === item.id ? null : prev))
            }
            onDrop={(e) => handleDrop(e, item.id)}
            onEdit={(field, value) => handleEdit(item, field, value)}
          />
        ))}

        {/* End-of-list drop zone so a row can be dragged to the bottom. */}
        {!readOnly && dragId && (
          <div
            onDragOver={(e) => handleDragOver(e, "end")}
            onDragLeave={() =>
              setDropId((prev) => (prev === "end" ? null : prev))
            }
            onDrop={(e) => handleDrop(e, "end")}
            className={cn(
              "mx-4 my-2 rounded-md border-2 border-dashed px-3 py-2 text-center text-xs",
              dropId === "end"
                ? "border-accent-400 bg-accent-50 text-accent-700"
                : "border-gray-200 text-gray-400"
            )}
          >
            Move to end
          </div>
        )}
      </div>

      {!readOnly && <AddItemForm characterId={character.id} />}
    </div>
  );
}
