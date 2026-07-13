"use client";

import { useState } from "react";
import { Button, Typography } from "@/components/ui";
import type { Character, InventoryLogEntry } from "@/lib/queries/inventory";
import { CharacterPanel } from "./characters/CharacterPanel";
import { CharacterSidebar } from "./characters/CharacterSidebar";
import { InventoryLogPanel } from "./log/InventoryLogPanel";
import { useInventoryRealtime } from "./useInventoryRealtime";

// The inventory tool: party roster sidebar + the selected character's
// inventory, with the campaign-wide change log behind a "View log" button.
export function InventoryTool({
  campaignId,
  publicCode,
  characters,
  selectedCharacterId,
  log,
}: {
  campaignId: string;
  publicCode: string;
  characters: Character[];
  selectedCharacterId: string | null;
  log: InventoryLogEntry[];
}) {
  const [logOpen, setLogOpen] = useState(false);

  // Refresh this view whenever another user changes the campaign's inventory.
  useInventoryRealtime(campaignId);

  function characterHref(characterId: string) {
    const params = new URLSearchParams({ tool: "inventory" });
    if (characterId) params.set("character", characterId);
    return `/campaigns/${publicCode}?${params.toString()}`;
  }

  const selected =
    characters.find((c) => c.id === selectedCharacterId) ?? null;

  return (
    <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        id="inventory-sidebar"
        className="border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r"
      >
        <CharacterSidebar
          campaignId={campaignId}
          characters={characters}
          selectedCharacterId={selectedCharacterId}
          characterHref={characterHref}
        />
      </aside>

      <main id="inventory-main" className="flex min-h-[42rem] flex-col bg-white">
        {selected ? (
          <CharacterPanel
            campaignId={campaignId}
            character={selected}
            allCharacters={characters}
            onViewLog={() => setLogOpen(true)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="max-w-sm">
              <Typography variant="h3" as="h2">
                {characters.length > 0 ? "Select a character" : "No party yet"}
              </Typography>
              <Typography variant="muted" className="mt-2 leading-6">
                {characters.length > 0
                  ? "Pick a party member to see their backpack."
                  : "Add the first character to start tracking the party's gear."}
              </Typography>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setLogOpen(true)}
              >
                View log
              </Button>
            </div>
          </div>
        )}
      </main>

      {logOpen && (
        <InventoryLogPanel entries={log} onClose={() => setLogOpen(false)} />
      )}
    </div>
  );
}
