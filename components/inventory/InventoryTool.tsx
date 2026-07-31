"use client";

import { useEffect, useState } from "react";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { fetchInventoryLogClient } from "@/lib/inventory/client-state";
import type { Character, InventoryLogEntry } from "@/lib/queries/inventory";
import { CharacterPanel } from "./characters/CharacterPanel";
import { CharacterSidebar } from "./characters/CharacterSidebar";
import { InventoryProvider, useInventory } from "./InventoryContext";
import { InventoryLogPanel } from "./log/InventoryLogPanel";

// The inventory tool: party roster sidebar + the selected character's
// inventory, with the campaign-wide change log behind a "View log" button.
export function InventoryTool({
  campaignId,
  publicCode,
  characters,
  selectedCharacterId,
  log,
  readOnly,
}: {
  campaignId: string;
  publicCode: string;
  characters: Character[];
  selectedCharacterId: string | null;
  log: InventoryLogEntry[];
  readOnly?: boolean;
}) {
  return (
    <InventoryProvider
      campaignId={campaignId}
      characters={characters}
      readOnly={readOnly}
    >
      <InventoryToolBody
        publicCode={publicCode}
        selectedCharacterId={selectedCharacterId}
        initialLog={log}
      />
    </InventoryProvider>
  );
}

function InventoryToolBody({
  publicCode,
  selectedCharacterId,
  initialLog,
}: {
  publicCode: string;
  selectedCharacterId: string | null;
  initialLog: InventoryLogEntry[];
}) {
  const { t } = useI18n();
  const { campaignId, characters, readOnly, changeToken } = useInventory();
  const [logOpen, setLogOpen] = useState(false);
  const [log, setLog] = useState(initialLog);

  // Read the log only while the panel is open — it is the one piece of
  // inventory state the client can't derive from its own mutations (server
  // stamps the actor name and timestamp).
  useEffect(() => {
    if (!logOpen || readOnly) return;
    let cancelled = false;
    void fetchInventoryLogClient(campaignId).then((entries) => {
      if (!cancelled) setLog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [logOpen, campaignId, readOnly, changeToken]);

  function characterHref(characterId: string) {
    const params = new URLSearchParams({ tool: "inventory" });
    if (characterId) params.set("character", characterId);
    return `/campaigns/${publicCode}?${params.toString()}`;
  }

  // Fall back to the first character when the selected one is gone (e.g. just
  // deleted optimistically, before the URL catches up).
  const selected =
    characters.find((c) => c.id === selectedCharacterId) ??
    characters[0] ??
    null;

  return (
    <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        id="inventory-sidebar"
        className="border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r"
      >
        <CharacterSidebar
          selectedCharacterId={selected?.id ?? null}
          characterHref={characterHref}
        />
      </aside>

      <main id="inventory-main" className="flex min-h-[42rem] flex-col bg-white">
        {selected ? (
          <CharacterPanel
            character={selected}
            onViewLog={() => setLogOpen(true)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="max-w-sm">
              <Typography variant="h3" as="h2">
                {characters.length > 0
                  ? t("inventory.selectCharacter")
                  : t("inventory.noParty")}
              </Typography>
              <Typography variant="muted" className="mt-2 leading-6">
                {characters.length > 0
                  ? t("character.viewInventory")
                  : t("inventory.addCharacter")}
              </Typography>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => setLogOpen(true)}
              >
                {t("inventory.viewLog")}
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
