"use client";

import { CombatantStatusIcons } from "@/components/combat/table/CombatantStatusIcons";
import type { CombatCombatant } from "@/lib/combat/types";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";

type PreviewCombatant = {
  name: string;
  combatantType: CombatCombatant["combatantType"];
  visible: boolean;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  status: "healthy" | "hurt" | "bloodied" | "critical";
  reactionUsed: boolean;
  active?: boolean;
};

const COMBATANTS: PreviewCombatant[] = [
  {
    name: "Mara",
    combatantType: "player",
    visible: true,
    initiative: 18,
    hp: 22,
    maxHp: 32,
    ac: 18,
    status: "hurt",
    reactionUsed: false,
    active: true,
  },
  {
    name: "Dex",
    combatantType: "player",
    visible: true,
    initiative: 16,
    hp: 9,
    maxHp: 21,
    ac: 15,
    status: "bloodied",
    reactionUsed: true,
  },
  {
    name: "Tobi",
    combatantType: "ally",
    visible: true,
    initiative: 12,
    hp: 26,
    maxHp: 27,
    ac: 17,
    status: "healthy",
    reactionUsed: false,
  },
  {
    name: "Corrupted Stag",
    combatantType: "enemy",
    visible: true,
    initiative: 11,
    hp: 8,
    maxHp: 52,
    ac: 14,
    status: "critical",
    reactionUsed: false,
  },
  {
    name: "Blight Wolf",
    combatantType: "enemy",
    visible: false,
    initiative: 8,
    hp: 18,
    maxHp: 24,
    ac: 13,
    status: "hurt",
    reactionUsed: false,
  },
];

const STATUS_BG: Record<PreviewCombatant["status"], string> = {
  healthy: "bg-emerald-100",
  hurt: "bg-amber-100",
  bloodied: "bg-red-100",
  critical: "bg-gray-300",
};

// A static, hand-built mockup of the combat tracker for the marketing
// homepage — not a real screenshot, so it stays crisp at any size and never
// goes stale when the real UI changes.
export function CombatPreview() {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50/60 p-2 shadow-sm sm:p-3">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wide text-gray-700 lg:grid-cols-[3rem_minmax(0,1fr)_2.5rem_6.5rem_4rem]">
        <span className="text-center">{t("combat.table.initiative")}</span>
        <span>{t("combat.table.combatant")}</span>
        <span className="hidden text-center lg:block">{t("combat.table.ac")}</span>
        <span className="hidden text-center lg:block">{t("combat.table.hitPoints")}</span>
        <span className="text-center">{t("combat.table.reaction")}</span>
      </div>

      <div className="mt-1.5 flex flex-col gap-1.5">
        {COMBATANTS.map((combatant) => {
          return (
            <div
              key={combatant.name}
              className={cn(
                "relative grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 rounded-lg border px-3 py-2 text-sm lg:grid-cols-[3rem_minmax(0,1fr)_2.5rem_6.5rem_4rem]",
                STATUS_BG[combatant.status],
                combatant.active
                  ? "border-slate-400 shadow-[0_0_0_1px_rgba(71,85,105,0.08),0_2px_6px_rgba(15,23,42,0.08)]"
                  : "border-gray-200"
              )}
            >
              {combatant.active && (
                <span className="absolute -top-2 left-3 rounded-full bg-slate-600 px-1.5 py-px text-[0.55rem] font-bold uppercase tracking-wide text-white">
                  Active
                </span>
              )}
              <span className="text-center font-bold tabular-nums text-gray-600">
                {combatant.initiative}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <CombatantStatusIcons combatant={combatant} isDm />
                <p className="min-w-0 truncate font-semibold text-gray-800">
                  {combatant.name}
                </p>
              </div>
              <span className="hidden text-center font-semibold tabular-nums text-gray-700 lg:block">
                {combatant.ac}
              </span>
              <span className="hidden text-center font-semibold tabular-nums text-gray-800 lg:block">
                {combatant.hp} / {combatant.maxHp}
              </span>
              <span className="flex justify-center">
                <span
                  className={cn(
                    "h-4 w-4 rounded border",
                    combatant.reactionUsed
                      ? "border-accent-600 bg-accent-600"
                      : "border-gray-300 bg-white"
                  )}
                  aria-hidden
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
