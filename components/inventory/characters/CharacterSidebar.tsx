"use client";

import { useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCharacter,
  renameCharacter,
  reorderCharacters,
} from "@/app/actions/inventory";
import { Typography, type MenuEntry } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import type { Character } from "@/lib/queries/inventory";
import * as optimistic from "@/lib/inventory/optimistic";
import { useInventory } from "../InventoryContext";
import { AddCharacterDialog } from "./AddCharacterDialog";
import { CharacterRow } from "./CharacterRow";

// The party roster: draggable character rows with rename/delete menus and an
// "Add character" dialog. Dropping a row inserts it before the row under the
// cursor; the end-of-list zone appends.
export function CharacterSidebar({
  selectedCharacterId,
  characterHref,
}: {
  selectedCharacterId: string | null;
  characterHref: (characterId: string) => string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { campaignId, characters, readOnly, run } = useInventory();
  const [dragId, setDragId] = useState<string | null>(null);
  // null = no target; "end" = append at the end of the list.
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

    const ids = characters.map((c) => c.id).filter((id) => id !== sourceId);
    if (targetId === "end") {
      ids.push(sourceId);
    } else {
      const at = ids.indexOf(targetId);
      if (at === -1) return;
      ids.splice(at, 0, sourceId);
    }

    void run(
      (prev) => optimistic.reorderCharacters(prev, ids),
      () => reorderCharacters({ campaignId, orderedIds: ids })
    );
  }

  function handleRename(character: Character) {
    const name = window.prompt(t("character.rename"), character.name)?.trim();
    if (!name || name === character.name) return;
    void run(
      (prev) => optimistic.patchCharacter(prev, character.id, { name }),
      () => renameCharacter(character.id, name)
    );
  }

  function handleDelete(character: Character) {
    if (
      !window.confirm(
        t("character.deleteConfirm", { name: character.name })
      )
    )
      return;

    // Navigate off the deleted character first so the panel doesn't render a
    // row that's already gone from local state.
    if (character.id === selectedCharacterId) {
      const remaining = characters.find((c) => c.id !== character.id);
      router.push(remaining ? characterHref(remaining.id) : characterHref(""));
    }

    void run(
      (prev) => optimistic.removeCharacter(prev, character.id),
      () => deleteCharacter(character.id)
    );
  }

  function menuEntries(character: Character): MenuEntry[] {
    return [
      { label: t("character.rename"), onSelect: () => handleRename(character) },
      {
        label: t("character.delete"),
        onSelect: () => handleDelete(character),
        danger: true,
      },
    ];
  }

  return (
    <div className="flex h-full flex-col">
      <Typography
        variant="small"
        className="px-3 font-semibold uppercase tracking-wide text-gray-400"
      >
        {t("inventory.party")}
      </Typography>

      <div id="inventory-character-list" className="mt-2 flex-1 space-y-1">
        {characters.length === 0 && (
          <Typography variant="muted" className="px-3 py-2">
            {t("addCharacter.noCharacters")}
          </Typography>
        )}

        {characters.map((character) => (
          <CharacterRow
            key={character.id}
            character={character}
            selected={character.id === selectedCharacterId}
            href={characterHref(character.id)}
            menuEntries={readOnly ? [] : menuEntries(character)}
            dragging={dragId === character.id}
            dropIndicator={dropId === character.id}
            dragEnabled={!readOnly}
            onDragStart={() => setDragId(character.id)}
            onDragEnd={clearDrag}
            onDragOver={(e) => handleDragOver(e, character.id)}
            onDragLeave={() =>
              setDropId((prev) => (prev === character.id ? null : prev))
            }
            onDrop={(e) => handleDrop(e, character.id)}
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
              "rounded-md border-2 border-dashed px-3 py-2 text-center text-xs",
              dropId === "end"
                ? "border-accent-400 bg-accent-50 text-accent-700"
                : "border-gray-200 text-gray-400"
            )}
          >
            {t("character.moveToEnd")}
          </div>
        )}
      </div>

      {!readOnly && (
        <div id="inventory-sidebar-actions" className="mt-5">
          <AddCharacterDialog
            campaignId={campaignId}
            characterHref={characterHref}
          />
        </div>
      )}
    </div>
  );
}
