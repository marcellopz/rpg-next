"use client";

import { X } from "lucide-react";
import { removeCondition } from "@/app/actions/combat";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";

export function ConditionChip({
  conditionId,
  title,
  duration,
  color,
  isDm,
}: {
  conditionId: string;
  title: string;
  duration: number;
  color: string;
  isDm: boolean;
}) {
  const { campaignId, runAction } = useCombatTracker();
  const indefinite = duration === -1;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-black/10"
      style={{ backgroundColor: color }}
    >
      {isDm && (
        <button
          type="button"
          className="-ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/10 transition hover:bg-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700"
          onClick={() => {
            void runAction(
              (prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  combatants: prev.combatants.map((c) => ({
                    ...c,
                    conditions: c.conditions.filter((x) => x.id !== conditionId),
                  })),
                };
              },
              () => removeCondition({ campaignId, conditionId })
            );
          }}
          aria-label={`Remove ${title}`}
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      )}
      <span>{title}</span>
      {!indefinite && (
        <span className="rounded-full bg-black/10 px-1 font-semibold tabular-nums">
          {duration}
        </span>
      )}
    </span>
  );
}
