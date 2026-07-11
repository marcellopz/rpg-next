"use client";

import { setShowHpToPlayers } from "@/app/actions/combat";
import { applyShowHpToPlayers } from "@/lib/combat/turn-engine";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";

export function CombatShowHpToggle() {
  const { combat, campaignId, runAction } = useCombatTracker();
  if (!combat) return null;

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-gray-800">
          Show hit points to players
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-gray-500">
          Health colors remain visible even when exact values are hidden.
        </span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
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
        <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-accent-600 peer-focus-visible:ring-2 peer-focus-visible:ring-accent-500 peer-focus-visible:ring-offset-2" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
