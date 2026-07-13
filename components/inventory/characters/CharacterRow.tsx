"use client";

import { NavLink } from "@/components/navigation/NavLink";
import type { DragEvent } from "react";
import { Menu, type MenuEntry } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Character } from "@/lib/queries/inventory";
import { CharacterAvatar } from "./CharacterAvatar";

export function CharacterRow({
  character,
  selected,
  href,
  menuEntries,
  dragging,
  dropIndicator,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  character: Character;
  selected: boolean;
  href: string;
  menuEntries: MenuEntry[];
  dragging: boolean;
  dropIndicator: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
}) {
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
        "group flex items-center gap-1 border-t-2",
        dropIndicator ? "border-accent-400" : "border-transparent",
        dragging && "opacity-40"
      )}
    >
      <NavLink
        href={href}
        draggable={false}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm",
          selected
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <CharacterAvatar
          name={character.name}
          imageUrl={character.imageUrl}
          size={28}
          className="border border-gray-200"
        />
        <span className="truncate font-medium">{character.name}</span>
      </NavLink>
      <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Menu label={`Options for ${character.name}`} entries={menuEntries} />
      </div>
    </div>
  );
}
