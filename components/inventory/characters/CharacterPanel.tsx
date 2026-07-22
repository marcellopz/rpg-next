"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, History } from "lucide-react";
import {
  updateCharacterImage,
  updateCharacterStat,
  type CharacterStatField,
} from "@/app/actions/inventory";
import { ImageCropDialog } from "@/components/images/ImageCropDialog";
import { IconButton, Tooltip } from "@/components/ui";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useI18n } from "@/lib/i18n/context";
import type { Character } from "@/lib/queries/inventory";
import { carryWeight } from "../encumbrance";
import { InlineEdit } from "../InlineEdit";
import { ItemsTable } from "../items/ItemsTable";
import { cn } from "@/lib/cn";
import { CharacterAvatar } from "./CharacterAvatar";
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
  campaignId,
  character,
  allCharacters,
  onViewLog,
  readOnly,
}: {
  campaignId: string;
  character: Character;
  allCharacters: Character[];
  onViewLog: () => void;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const weight = carryWeight(character);
  const [photoOpen, setPhotoOpen] = useState(false);
  const { upload } = useFileUpload("public");

  async function commitStat(field: CharacterStatField, raw: string) {
    const result = await updateCharacterStat(character.id, field, Number(raw));
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function savePhoto(blob: Blob): Promise<string | null> {
    const file = new File([blob], "portrait.jpg", { type: "image/jpeg" });
    const uploaded = await upload(file, { campaignId, folder: "portraits" });
    if (!uploaded) return t("errors.save");
    const result = await updateCharacterImage(character.id, uploaded.path);
    if (!result.ok) return result.error;
    router.refresh();
    return null;
  }

  async function removePhoto(): Promise<string | null> {
    const result = await updateCharacterImage(character.id, null);
    if (!result.ok) return result.error;
    router.refresh();
    return null;
  }

  return (
    <div id="inventory-character-panel" className="flex flex-1 flex-col">
      <header
        className="grid items-center gap-3 gap-y-2 border-b border-gray-200 px-3 py-3 sm:px-4 lg:gap-y-0"
        style={{ gridTemplateColumns: "auto 1fr auto" }}
      >
        <style>{`@media (min-width: 1024px) { header { grid-template-columns: auto 1fr auto auto; } }`}</style>
        {/* Avatar - spans 3 rows on mobile, 2 rows on desktop */}
        <div className="col-start-1 row-start-1 row-span-3 lg:row-span-2">
          {readOnly ? (
            <CharacterAvatar
              name={character.name}
              imageUrl={character.imageUrl}
              size={50}
              className="border border-gray-200"
            />
          ) : (
            <Tooltip label={t("character.photo")}>
              <button
                type="button"
                aria-label={`Change ${character.name}'s photo`}
                onClick={() => setPhotoOpen(true)}
                className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <CharacterAvatar
                  name={character.name}
                  imageUrl={character.imageUrl}
                  size={50}
                  className="border border-gray-200"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Name - row 1, col 2 */}
        <div className="col-start-2 row-start-1 min-w-0 lg:col-start-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-gray-900">
            {character.name}
          </h2>
        </div>

        {/* History button - row 1, col 3 on mobile, row 1 col 4 on desktop */}
        <div className="col-start-3 row-start-1 flex justify-end lg:col-start-4">
          <Tooltip label={t("character.viewLog")}>
            <IconButton
              aria-label={t("character.viewLog")}
              onClick={onViewLog}
              className="h-6 w-6 shrink-0"
            >
              <History className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>

        {/* Stats row: STR and coins - row 2, col 2-3 on mobile, row 1 col 3 on desktop */}
        <div className="col-start-2 col-span-2 row-start-2 flex flex-wrap items-center justify-between text-xs sm:gap-3 lg:col-start-3 lg:col-span-1 lg:row-start-1 lg:justify-start lg:gap-1">
          <div className="flex items-center gap-0.5">
            <span className="font-semibold uppercase tracking-wide text-gray-400">
              STR
            </span>
            <InlineEdit
              value={String(character.strength)}
              ariaLabel={`${character.name}'s strength`}
              type="number"
              displayClassName={COMPACT_EDIT}
              inputClassName="text-xs"
              readOnly={readOnly}
              onCommit={(v) => commitStat("strength", v)}
            />
          </div>
          {COIN_FIELDS.map(({ field, label, dot }) => (
            <div key={field} className="flex items-center gap-0.5">
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
                inputClassName="text-xs"
                readOnly={readOnly}
                onCommit={(v) => commitStat(field, v)}
              />
            </div>
          ))}
        </div>

        {/* Encumbrance bar - row 3, col 2-3 on mobile, row 2 col 2-3 on desktop */}
        <div className="col-start-2 col-span-2 row-start-3 w-full lg:row-start-2">
          <EncumbranceBar strength={character.strength} weight={weight} />
        </div>
      </header>

      <ItemsTable character={character} allCharacters={allCharacters} readOnly={readOnly} />

      {photoOpen && (
        <ImageCropDialog
          title={t("characterPhoto.title")}
          description={t("characterPhoto.description")}
          aspect={1}
          cropShape="round"
          outputWidth={512}
          outputHeight={512}
          onSave={savePhoto}
          onRemove={character.imageUrl ? removePhoto : undefined}
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </div>
  );
}
