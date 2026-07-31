"use client";

import { useState, type DragEvent } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import {
  deleteResourceCard,
  renameResourceCard,
  reorderResourceItems,
} from "@/app/actions/resources";
import type { ResourceCard } from "@/lib/resources/types";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  patchCard,
  removeCard,
  reorderCardItems,
} from "@/lib/resources/optimistic";
import { AddResourceForm } from "./AddResourceForm";
import { ResourceItemRow } from "./ResourceItemRow";
import { useResources } from "./ResourcesContext";

export function ResourceCardPanel({
  card,
  isEditing,
  readOnly,
}: {
  card: ResourceCard;
  isEditing: boolean;
  readOnly?: boolean;
}) {
  const { run } = useResources();
  const [name, setName] = useState(card.name);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | "end" | null>(null);

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

    const ids = card.items.map((i) => i.id).filter((id) => id !== sourceId);
    if (targetId === "end") {
      ids.push(sourceId);
    } else {
      const at = ids.indexOf(targetId);
      if (at === -1) return;
      ids.splice(at, 0, sourceId);
    }

    void run(
      (d) => reorderCardItems(d, card.id, ids),
      () => reorderResourceItems({ cardId: card.id, orderedIds: ids })
    );
  }

  function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === card.name) return;
    void run(
      (d) => patchCard(d, card.id, { name: trimmed }),
      () => renameResourceCard({ cardId: card.id, name: trimmed })
    );
  }

  function handleDelete() {
    void run(
      (d) => removeCard(d, card.id),
      () => deleteResourceCard(card.id)
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 px-3">
        {isEditing && (
          <button
            type="button"
            className="draggable-handle shrink-0 cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
            aria-label={`Drag ${card.name}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm font-semibold"
            aria-label="Character name"
          />
        ) : (
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {card.name}
          </h3>
        )}
        {card.characterId && (
          <span className="shrink-0 text-[0.65rem] uppercase tracking-wide text-gray-400">
            Linked
          </span>
        )}
        {isEditing && (
          <IconButton
            aria-label={`Delete ${card.name}`}
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {card.items.length === 0 && !isEditing && (
          <p className="text-sm text-gray-500">No resources yet.</p>
        )}
        {card.items.map((item) => (
          <ResourceItemRow
            key={item.id}
            item={item}
            isEditing={isEditing}
            readOnly={readOnly}
            dragging={dragId === item.id}
            dropIndicator={dropId === item.id}
            onDragStart={() => setDragId(item.id)}
            onDragEnd={clearDrag}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={() =>
              setDropId((prev) => (prev === item.id ? null : prev))
            }
            onDrop={(e) => handleDrop(e, item.id)}
          />
        ))}

        {isEditing && dragId && (
          <div
            onDragOver={(e) => handleDragOver(e, "end")}
            onDragLeave={() =>
              setDropId((prev) => (prev === "end" ? null : prev))
            }
            onDrop={(e) => handleDrop(e, "end")}
            className={cn(
              "rounded-md border-2 border-dashed px-3 py-2 text-center text-xs",
              dropId === "end"
                ? "border-accent-400 bg-accent-50 text-accent-700"
                : "border-gray-200 text-gray-400"
            )}
          >
            Move to end
          </div>
        )}

        {isEditing && <AddResourceForm cardId={card.id} />}
      </div>
    </div>
  );
}
