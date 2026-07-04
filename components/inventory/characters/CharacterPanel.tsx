"use client";

import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { PictoAvatar } from "@/components/PictoAvatar";
import {
  updateCharacterStat,
  type CharacterStatField,
} from "@/app/actions/inventory";
import { IconButton, Tooltip } from "@/components/ui";
import type { Character } from "@/lib/queries/inventory";
import { carryWeight } from "../encumbrance";
import { InlineEdit } from "../InlineEdit";
import { ItemsTable } from "../items/ItemsTable";
import { cn } from "@/lib/cn";
import { EncumbranceBar } from "./EncumbranceBar";

const COIN_FIELDS: {
  field: CharacterStatField;
  label: string;
  dot: string;
}[] = [
  { field: "platinum", label: "PP", dot: "bg-slate-400" },
  { field: "gold", label: "GP", dot: "bg-amber-400" },
  { field: "silver", label: "SP", dot: "bg-gray-300" },
  { field: "copper", label: "CP", dot: "bg-orange-600" },
];

const COMPACT_EDIT =
  "min-w-[1.75rem] font-medium tabular-nums text-gray-900";

// One character's full inventory: compact profile header with encumbrance
// bar, STR and coins inline beside the log button, and items below.
export function CharacterPanel({
  character,
  allCharacters,
  onViewLog,
}: {
  character: Character;
  allCharacters: Character[];
  onViewLog: () => void;
}) {
  const router = useRouter();
  const weight = carryWeight(character);

  async function commitStat(field: CharacterStatField, raw: string) {
    const result = await updateCharacterStat(character.id, field, Number(raw));
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  return (
    <div id="inventory-character-panel" className="flex flex-1 flex-col">
      <header className="flex gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <PictoAvatar
            seed={character.name}
            size={50}
            className="border border-gray-200"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">
                {character.name}
              </h2>
              <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-semibold uppercase tracking-wide text-gray-400">
                    STR
                  </span>
                  <InlineEdit
                    value={String(character.strength)}
                    ariaLabel={`${character.name}'s strength`}
                    type="number"
                    displayClassName={COMPACT_EDIT}
                    inputClassName="w-10 text-xs"
                    onCommit={(v) => commitStat("strength", v)}
                  />
                </div>
                {COIN_FIELDS.map(({ field, label, dot }) => (
                  <div key={field} className="flex items-center gap-1">
                    <span className="flex items-center gap-0.5 font-semibold uppercase tracking-wide text-gray-400">
                      <span
                        className={cn("h-2 w-2 shrink-0 rounded-full", dot)}
                        aria-hidden="true"
                      />
                      {label}
                    </span>
                    <InlineEdit
                      value={String(character[field])}
                      ariaLabel={`${character.name}'s ${field}`}
                      type="number"
                      displayClassName={COMPACT_EDIT}
                      inputClassName="w-10 text-xs"
                      onCommit={(v) => commitStat(field, v)}
                    />
                  </div>
                ))}
              </div>
              <Tooltip label="View inventory log">
                <IconButton
                  aria-label="View inventory log"
                  onClick={onViewLog}
                  className="h-6 w-6 shrink-0"
                >
                  <History className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            </div>

            <EncumbranceBar strength={character.strength} weight={weight} />
          </div>
        </div>
      </header>

      <ItemsTable character={character} allCharacters={allCharacters} />
    </div>
  );
}
