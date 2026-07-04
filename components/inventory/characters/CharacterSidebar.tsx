"use client";

import { useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCharacter,
  renameCharacter,
  reorderCharacters,
} from "@/app/actions/inventory";
import { Typography, type MenuEntry } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Character } from "@/lib/queries/inventory";
import { AddCharacterDialog } from "./AddCharacterDialog";
import { CharacterRow } from "./CharacterRow";

// The party roster: draggable character rows with rename/delete menus and an
// "Add character" dialog. Dropping a row inserts it before the row under the
// cursor; the end-of-list zone appends.
export function CharacterSidebar({
  campaignId,
  characters,
  selectedCharacterId,
  characterHref,
}: {
  campaignId: string;
  characters: Character[];
  selectedCharacterId: string | null;
  characterHref: (characterId: string) => string;
}) {
  const router = useRouter();
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

  async function handleDrop(e: DragEvent, targetId: string | "end") {
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

    const result = await reorderCharacters({ campaignId, orderedIds: ids });
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function handleRename(character: Character) {
    const name = window.prompt("Rename character", character.name)?.trim();
    if (!name || name === character.name) return;
    const result = await renameCharacter(character.id, name);
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function handleDelete(character: Character) {
    if (
      !window.confirm(
        `Remove "${character.name}" from the party? Their inventory is deleted too.`
      )
    )
      return;
    const result = await deleteCharacter(character.id);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    if (character.id === selectedCharacterId) {
      const remaining = characters.find((c) => c.id !== character.id);
      router.push(remaining ? characterHref(remaining.id) : characterHref(""));
    }
    router.refresh();
  }

  function menuEntries(character: Character): MenuEntry[] {
    return [
      { label: "Rename", onSelect: () => handleRename(character) },
      {
        label: "Delete",
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
        Party
      </Typography>

      <div id="inventory-character-list" className="mt-2 flex-1 space-y-1">
        {characters.length === 0 && (
          <Typography variant="muted" className="px-3 py-2">
            No characters yet. Add the first party member below.
          </Typography>
        )}

        {characters.map((character) => (
          <CharacterRow
            key={character.id}
            character={character}
            selected={character.id === selectedCharacterId}
            href={characterHref(character.id)}
            menuEntries={menuEntries(character)}
            dragging={dragId === character.id}
            dropIndicator={dropId === character.id}
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
        {dragId && (
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
      </div>

      <div id="inventory-sidebar-actions" className="mt-5">
        <AddCharacterDialog
          campaignId={campaignId}
          characterHref={characterHref}
        />
      </div>
    </div>
  );
}
