"use client";

import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  advanceTurn,
  resetRound,
  retreatTurn,
  setRound,
  sortByInitiative,
} from "@/app/actions/combat";
import {
  applyAdvanceTurn,
  applyResetRound,
  applyRetreatTurn,
  applySetRound,
  applySortByInitiative,
} from "@/lib/combat/turn-engine";
import { useI18n } from "@/lib/i18n/context";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button } from "@/components/ui";

export function CombatTrackerFooter({
  onAddCombatant,
}: {
  onAddCombatant: () => void;
}) {
  const { t } = useI18n();
  const { combat, campaignId, isDm, runAction } = useCombatTracker();
  if (!combat) return null;

  const { session } = combat;

  if (!isDm) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
          {session.round === 0 ? t("combat.waitingToStart") : t("combat.round", { round: session.round })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {session.round > 0 && (
          <div className="inline-flex rounded-md shadow-sm">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-r-none"
              onClick={() =>
                runAction(
                  (prev) => (prev ? applyRetreatTurn(prev) : prev),
                  () => retreatTurn(campaignId)
                )
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              {t("combat.buttons.prev")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="-ml-px rounded-l-none"
              onClick={() =>
                runAction(
                  (prev) => (prev ? applyAdvanceTurn(prev) : prev),
                  () => advanceTurn(campaignId)
                )
              }
            >
              {t("combat.buttons.next")}
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            runAction(
              (prev) => (prev ? applySortByInitiative(prev) : prev),
              () => sortByInitiative(campaignId)
            )
          }
        >
          <ArrowDownUp className="mr-1.5 h-4 w-4" aria-hidden />
          {t("combat.buttons.sort")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {session.round === 0 ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() =>
              runAction(
                (prev) => (prev ? applySetRound(prev, 1) : prev),
                () => setRound({ campaignId, round: 1 })
              )
            }
          >
            <Play className="mr-1.5 h-4 w-4" aria-hidden />
            {t("combat.buttons.startRound")}
          </Button>
        ) : (
          <>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200">
              {t("combat.round", { round: session.round })}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                runAction(
                  (prev) => (prev ? applyResetRound(prev) : prev),
                  () => resetRound(campaignId)
                )
              }
            >
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />
              {t("combat.buttons.reset")}
            </Button>
          </>
        )}
        <Button type="button" variant="primary" size="sm" onClick={onAddCombatant}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          {t("combat.buttons.add")}
        </Button>
      </div>
    </div>
  );
}
