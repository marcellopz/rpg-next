"use client";

import { setShowHpToPlayers } from "@/app/actions/combat";
import { applyShowHpToPlayers } from "@/lib/combat/turn-engine";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";

export function CombatShowHpToggle() {
  const { combat, campaignId, runAction } = useCombatTracker();
  if (!combat) return null;

  return (
    <label className="show-hp-toggle shrink-0">
      <input
        type="checkbox"
        checked={combat.session.showHpToPlayers}
        onChange={(e) => {
          void runAction(
            (prev) =>
              prev ? applyShowHpToPlayers(prev, e.target.checked) : prev,
            () =>
              setShowHpToPlayers({
                campaignId,
                show: e.target.checked,
              })
          );
        }}
      />
      Show HP to players
    </label>
  );
}
