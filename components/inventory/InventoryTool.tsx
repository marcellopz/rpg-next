"use client";

import { useEffect, useState } from "react";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";
import { fetchInventoryLogClient } from "@/lib/inventory/client-state";
import { isDemoCampaignId } from "@/data/demo-campaign";
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
  // null = closed; "all" = campaign-wide log; otherwise one character's id.
  const [logScope, setLogScope] = useState<string | null>(null);
  const [log, setLog] = useState(initialLog);
  const logOpen = logScope !== null;

  // Read the log only while the panel is open — it is the one piece of
  // inventory state the client can't derive from its own mutations (server
  // stamps the actor name and timestamp).
  useEffect(() => {
    if (!logOpen || readOnly || isDemoCampaignId(campaignId)) return;
    let cancelled = false;
    const characterId = logScope && logScope !== "all" ? logScope : undefined;
    void fetchInventoryLogClient(campaignId, 100, characterId).then((entries) => {
      if (!cancelled) setLog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [logOpen, logScope, campaignId, readOnly, changeToken]);

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

  const scopedCharacter =
    logScope && logScope !== "all"
      ? (characters.find((c) => c.id === logScope) ?? null)
      : null;
  // Filter locally too: the panel opens with the campaign-wide rows already in
  // state (and the demo never refetches), before the scoped fetch lands.
  const visibleLog = scopedCharacter
    ? log.filter(
        (entry) =>
          entry.characterId === scopedCharacter.id ||
          entry.targetCharacterId === scopedCharacter.id
      )
    : log;

  return (
    <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        id="inventory-sidebar"
        className="border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r"
      >
        <CharacterSidebar
          selectedCharacterId={selected?.id ?? null}
          characterHref={characterHref}
          onViewAllLogs={() => setLogScope("all")}
        />
      </aside>

      <main id="inventory-main" className="flex min-h-[42rem] flex-col bg-white">
        {selected ? (
          <CharacterPanel
            character={selected}
            onViewLog={() => setLogScope(selected.id)}
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
                onClick={() => setLogScope("all")}
              >
                {t("inventory.viewLog")}
              </Button>
            </div>
          </div>
        )}
      </main>

      {logScope !== null && (
        <InventoryLogPanel
          entries={visibleLog}
          title={
            scopedCharacter
              ? t("inventory.characterLogTitle", { name: scopedCharacter.name })
              : undefined
          }
          onClose={() => setLogScope(null)}
        />
      )}
    </div>
  );
}
