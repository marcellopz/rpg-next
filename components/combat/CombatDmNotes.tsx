"use client";

import { updateDmNotes } from "@/app/actions/combat";
import { applyDmNotes } from "@/lib/combat/turn-engine";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { useEffect, useState } from "react";

export function CombatDmNotes() {
  const { combat, campaignId, runAction } = useCombatTracker();
  const [notes, setNotes] = useState(combat?.session.dmNotes ?? "");

  useEffect(() => {
    setNotes(combat?.session.dmNotes ?? "");
  }, [combat?.session.dmNotes]);

  if (!combat) return null;

  return (
    <div className="dm-notes">
      <p>DM notes</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes === combat.session.dmNotes) return;
          void runAction(
            (prev) => (prev ? applyDmNotes(prev, notes) : prev),
            () => updateDmNotes({ campaignId, notes })
          );
        }}
        placeholder="Private notes for the DM…"
      />
    </div>
  );
}
