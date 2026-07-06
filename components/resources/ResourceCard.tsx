"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Trash2 } from "lucide-react";
import { deleteResourceCard, renameResourceCard } from "@/app/actions/resources";
import type { ResourceCard } from "@/lib/resources/types";
import { IconButton } from "@/components/ui";
import { AddResourceForm } from "./AddResourceForm";
import { ResourceItemRow } from "./ResourceItemRow";

export function ResourceCardPanel({
  card,
  isEditing,
}: {
  card: ResourceCard;
  isEditing: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(card.name);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === card.name) return;
    startTransition(async () => {
      await renameResourceCard({ cardId: card.id, name: trimmed });
      refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteResourceCard(card.id);
      refresh();
    });
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
            disabled={isPending}
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
            disabled={isPending}
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
          <ResourceItemRow key={item.id} item={item} isEditing={isEditing} />
        ))}
        {isEditing && <AddResourceForm cardId={card.id} />}
      </div>
    </div>
  );
}
