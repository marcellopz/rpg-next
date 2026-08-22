"use client";

import { useRef, useState } from "react";
import { removeCondition } from "@/app/actions/combat";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { ConditionActionsMenu } from "@/components/combat/ConditionActionsMenu";
import { EditConditionDialog } from "@/components/combat/dialogs/EditConditionDialog";

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

export function ConditionChip({
  conditionId,
  title,
  duration,
  color,
}: {
  conditionId: string;
  title: string;
  duration: number;
  color: string;
}) {
  const { campaignId, runAction, readOnly } = useCombatTracker();
  const indefinite = duration === -1;
  // Any signed-in member can edit/delete a condition (matches addCondition's
  // authorization level) — only a read-only (demo) campaign blocks it.
  const canManage = !readOnly && conditionId !== "preview";
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef({ x: 0, y: 0 });

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!canManage) return;
    // Stop the row's own long-press timer from also starting — without
    // this, holding a chip opened both the condition and row menus.
    e.stopPropagation();
    const touch = e.touches[0];
    longPressStart.current = { x: touch.clientX, y: touch.clientY };
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      setMenu({ x: touch.clientX, y: touch.clientY });
    }, LONG_PRESS_MS);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const dx = touch.clientX - longPressStart.current.x;
    const dy = touch.clientY - longPressStart.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clearLongPressTimer();
  }

  function handleRemove() {
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
  }

  return (
    <>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-black/10"
        style={{ backgroundColor: color }}
        onContextMenu={(e) => {
          if (!canManage) return;
          e.preventDefault();
          // Stop the row's own onContextMenu (combatant actions) from also
          // firing — without this, right-clicking a chip opened both menus.
          e.stopPropagation();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={clearLongPressTimer}
        onTouchCancel={clearLongPressTimer}
      >
        <span>{title}</span>
        {!indefinite && (
          <span className="rounded-full bg-black/10 px-1 font-semibold tabular-nums">
            {duration}
          </span>
        )}
      </span>

      {menu && (
        <ConditionActionsMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onEdit={() => setEditOpen(true)}
          onDelete={handleRemove}
        />
      )}
      {editOpen && (
        <EditConditionDialog
          open={editOpen}
          condition={{ id: conditionId, name: title, duration, color }}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
