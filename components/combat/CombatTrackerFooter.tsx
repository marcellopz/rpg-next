"use client";

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
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button } from "@/components/ui";

export function CombatTrackerFooter({
  onAddCombatant,
}: {
  onAddCombatant: () => void;
}) {
  const { combat, campaignId, isDm, runAction } = useCombatTracker();
  if (!combat) return null;

  const { session } = combat;

  return (
    <div className="tracker-actions">
      {isDm ? (
        <div id="actions-1" className="flex flex-wrap items-center gap-3">
          {session.round > 0 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  runAction(
                    (prev) => (prev ? applyRetreatTurn(prev) : prev),
                    () => retreatTurn(campaignId)
                  )
                }
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  runAction(
                    (prev) => (prev ? applyAdvanceTurn(prev) : prev),
                    () => advanceTurn(campaignId)
                  )
                }
              >
                Next
              </Button>
            </>
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
            Sort
          </Button>
        </div>
      ) : (
        <div />
      )}
      {isDm ? (
        <div id="actions-2" className="flex flex-wrap items-center gap-3">
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
              Start
            </Button>
          ) : (
            <>
              <span>Round {session.round}</span>
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
                Reset round
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onAddCombatant}
          >
            Add combatant
          </Button>
        </div>
      ) : (
        <span>Round {session.round}</span>
      )}
    </div>
  );
}
