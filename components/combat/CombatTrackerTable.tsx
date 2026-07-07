"use client";

import { useState, type DragEvent } from "react";
import { reorderCombatants } from "@/app/actions/combat";
import { resolveTurnForViewer } from "@/lib/combat/hp-colors";
import { applyReorderCombatants } from "@/lib/combat/turn-engine";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { CombatTrackerRow } from "@/components/combat/CombatTrackerRow";

function CombatTableHeader({ showHpColumns }: { showHpColumns: boolean }) {
  return (
    <div className="tracker-table-header">
      <div className="tracker-table-initiative" title="Initiative">
        Init
      </div>
      <span className="separator" />
      <div className="tracker-table-name">Name</div>
      {showHpColumns && (
        <>
          <span className="separator" />
          <div className="tracker-table-ac">AC</div>
          <span className="separator" />
          <div className="tracker-table-hp">HP</div>
        </>
      )}
      <span className="separator" />
      <div className="tracker-table-reaction">Reaction</div>
    </div>
  );
}

export function CombatTrackerTable() {
  const { combat, campaignId, isDm, runAction } = useCombatTracker();
  const [dragId, setDragId] = useState<string | null>(null);

  if (!combat) return null;

  const { session, combatants } = combat;
  const sorted = [...combatants].sort((a, b) => a.orderIndex - b.orderIndex);
  const turn = resolveTurnForViewer(session.turn, sorted, isDm);
  const showHpColumns = isDm || session.showHpToPlayers;

  function clearDrag() {
    setDragId(null);
  }

  function handleDragOver(e: DragEvent, targetId: string) {
    if (!isDm || !dragId || dragId === targetId) return;
    e.preventDefault();
  }

  async function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = dragId;
    clearDrag();
    if (!sourceId || sourceId === targetId || !isDm) return;

    const ids = sorted.map((c) => c.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);

    await runAction(
      (prev) => (prev ? applyReorderCombatants(prev, next) : prev),
      () => reorderCombatants({ campaignId, orderedIds: next })
    );
  }

  return (
    <div className="tracker-table">
      <CombatTableHeader showHpColumns={showHpColumns} />
      <div className="tracker-table-body">
        {sorted.length === 0 ? (
          <div id="no-combatants">No combatants yet.</div>
        ) : (
          sorted.map((combatant) => (
            <CombatTrackerRow
              key={combatant.id}
              combatant={combatant}
              turn={turn}
              showHpColumns={showHpColumns}
              dragging={dragId === combatant.id}
              dragEnabled={isDm}
              onDragStart={() => setDragId(combatant.id)}
              onDragEnd={clearDrag}
              onDragOver={(e) => handleDragOver(e, combatant.id)}
              onDrop={(e) => handleDrop(e, combatant.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
