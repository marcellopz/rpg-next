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
    <div className="chip" style={{ backgroundColor: color }}>
      {isDm && (
        <span
          className="closeButton"
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
          role="button"
          tabIndex={0}
          aria-label={`Remove ${title}`}
        >
          <X size={12} aria-hidden />
        </span>
      )}
      <span className="title">{title}</span>
      {!indefinite && <span className="number">{duration}</span>}
    </div>
  );
}
