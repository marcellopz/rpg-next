"use client";

import { useState, type DragEvent } from "react";
import { reorderCombatants } from "@/app/actions/combat";
import { resolveTurnForViewer } from "@/lib/combat/hp-colors";
import { applyReorderCombatants } from "@/lib/combat/turn-engine";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { CombatTrackerRow } from "@/components/combat/CombatTrackerRow";

function CombatTableHeader({ showHpColumns }: { showHpColumns: boolean }) {
  return (
    <div
      role="row"
      className={`tracker-table-header ${showHpColumns ? "with-hp" : "without-hp"}`}
    >
      <div role="columnheader" className="tracker-table-initiative" title="Initiative">
        Init
      </div>
      <div role="columnheader" className="tracker-table-name">Combatant</div>
      {showHpColumns && (
        <>
          <div role="columnheader" className="tracker-table-ac">AC</div>
          <div role="columnheader" className="tracker-table-hp">Hit points</div>
        </>
      )}
      <div role="columnheader" className="tracker-table-reaction">Reaction</div>
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
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <div
        role="table"
        aria-label="Combat initiative"
        className="tracker-table min-w-[42rem]"
      >
        <CombatTableHeader showHpColumns={showHpColumns} />
        <div role="rowgroup" className="tracker-table-body">
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
    </div>
  );
}
