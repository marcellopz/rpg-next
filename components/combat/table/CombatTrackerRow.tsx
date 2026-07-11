"use client";

import { GripVertical, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { setReactionUsed, updateCombatantHp } from "@/app/actions/combat";
import { getDisplayName, getHpColorClass } from "@/lib/combat/hp-colors";
import {
  applyCombatantHp,
  applyReactionUsed,
} from "@/lib/combat/turn-engine";
import type { CombatCombatant } from "@/lib/combat/types";
import { cn } from "@/lib/cn";
import { CombatantStatusIcons } from "@/components/combat/table/CombatantStatusIcons";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { ConditionChip } from "@/components/combat/ConditionChip";
import { CombatRowContextMenu } from "@/components/combat/table/CombatRowContextMenu";
import { AddConditionDialog } from "@/components/combat/dialogs/AddConditionDialog";
import { ConfirmDeleteCombatantDialog } from "@/components/combat/dialogs/ConfirmDeleteCombatantDialog";
import { EditCombatantDialog } from "@/components/combat/dialogs/EditCombatantDialog";
import { IconButton } from "@/components/ui";

export function CombatTrackerRow({
  combatant,
  turn,
  showHpColumns,
  dragging,
  dragEnabled,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  combatant: CombatCombatant;
  turn: number;
  showHpColumns: boolean;
  dragging?: boolean;
  dragEnabled?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const { campaignId, isDm, runAction } = useCombatTracker();
  const [hp, setHp] = useState(combatant.hp);
  const [openPlus, setOpenPlus] = useState(false);
  const [healValue, setHealValue] = useState(0);
  const [openMinus, setOpenMinus] = useState(false);
  const [damageValue, setDamageValue] = useState(0);
  const [editingHp, setEditingHp] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setHp(combatant.hp);
  }, [combatant.hp]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  function clearLongPressTimer() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    longPressStart.current = { x: touch.clientX, y: touch.clientY };
    clearLongPressTimer();
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    }, 500);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const dx = touch.clientX - longPressStart.current.x;
    const dy = touch.clientY - longPressStart.current.y;
    if (Math.hypot(dx, dy) > 10) clearLongPressTimer();
  }

  if (!isDm && combatant.visible === false) return null;

  const colorClass = getHpColorClass(combatant);
  const isTurn = combatant.orderIndex === turn;

  async function commitHp(nextHp: number) {
    await runAction(
      (prev) =>
        prev ? applyCombatantHp(prev, combatant.id, nextHp) : prev,
      () =>
        updateCombatantHp({
          campaignId,
          combatantId: combatant.id,
          hp: nextHp,
        })
    );
  }

  return (
    <>
      <AddConditionDialog
        open={conditionOpen}
        combatant={combatant}
        onClose={() => setConditionOpen(false)}
      />
      <EditCombatantDialog
        open={editOpen}
        combatant={combatant}
        onClose={() => setEditOpen(false)}
      />
      <ConfirmDeleteCombatantDialog
        open={deleteOpen}
        combatant={combatant}
        onClose={() => setDeleteOpen(false)}
      />
      {contextMenu && (
        <CombatRowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          open
          isDm={isDm}
          onClose={() => setContextMenu(null)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onAddCondition={() => setConditionOpen(true)}
        />
      )}
      <div
        role="row"
        draggable={dragEnabled}
        onDragStart={(e) => {
          if (!dragEnabled) return;
          e.dataTransfer.effectAllowed = "move";
          onDragStart?.();
        }}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={clearLongPressTimer}
        onTouchCancel={clearLongPressTimer}
        className={cn(
          "tracker-table-body-row",
          showHpColumns ? "with-hp" : "without-hp",
          colorClass,
          isTurn && "turn",
          combatant.visible === false && "hidden-from-players",
          dragging && "dragging"
        )}
      >
        <div role="cell" className="tracker-table-initiative">
          {dragEnabled && (
            <GripVertical
              className="combat-drag-handle h-5 w-5 shrink-0 text-gray-300"
              aria-label="Drag to reorder"
            />
          )}
          <span>{combatant.initiative}</span>
        </div>
        <div role="cell" className="tracker-table-name">
          <p className="tracker-table-name-text">
            <CombatantStatusIcons combatant={combatant} isDm={isDm} />
            <span className="truncate">{getDisplayName(combatant, isDm)}</span>
          </p>
          {combatant.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {combatant.conditions.map((effect) => (
                <ConditionChip
                  key={effect.id}
                  conditionId={effect.id}
                  title={effect.name}
                  duration={effect.duration}
                  color={effect.color}
                  isDm={isDm}
                />
              ))}
            </div>
          )}
        </div>
        {showHpColumns && (
          <>
            <div role="cell" className="tracker-table-ac">{combatant.ac}</div>
            <div role="cell" className="tracker-table-hp">
              {isDm ? (
                <>
                  {openPlus ? (
                    <input
                      className="hp-input"
                      type="number"
                      autoFocus
                      value={healValue}
                      onChange={(e) => setHealValue(Number(e.target.value) || 0)}
                      onBlur={() => setOpenPlus(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setOpenPlus(false);
                          void commitHp(hp + healValue);
                          setHealValue(0);
                        }
                      }}
                    />
                  ) : (
                    <IconButton
                      className="hp-heal h-7 w-7 rounded-md text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      onClick={() => setOpenPlus(true)}
                      aria-label="Heal"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </IconButton>
                  )}
                  {editingHp ? (
                    <input
                      className="hp-input hp-input-wide"
                      type="number"
                      autoFocus
                      value={hp}
                      onChange={(e) => setHp(Number(e.target.value) || 0)}
                      onBlur={() => setEditingHp(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setEditingHp(false);
                          void commitHp(hp);
                        }
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      className="hp-value hp-value-editable rounded px-1.5 py-1 font-semibold tabular-nums hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                      onClick={() => setEditingHp(true)}
                      aria-label={`Edit hit points for ${combatant.name}`}
                    >
                      {combatant.hp} / {combatant.maxHp}
                    </button>
                  )}
                  {openMinus ? (
                    <input
                      className="hp-input"
                      type="number"
                      autoFocus
                      value={damageValue}
                      onChange={(e) => setDamageValue(Number(e.target.value) || 0)}
                      onBlur={() => setOpenMinus(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setOpenMinus(false);
                          void commitHp(hp - damageValue);
                          setDamageValue(0);
                        }
                      }}
                    />
                  ) : (
                    <IconButton
                      className="hp-damage h-7 w-7 rounded-md text-red-700 hover:bg-red-100 hover:text-red-800"
                      onClick={() => setOpenMinus(true)}
                      aria-label="Damage"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </IconButton>
                  )}
                </>
              ) : (
                <span className="tracker-table-hp-readonly">
                  {combatant.hp} / {combatant.maxHp}
                </span>
              )}
            </div>
          </>
        )}
        <div role="cell" className="tracker-table-reaction">
          <input
            type="checkbox"
            aria-label={`Reaction used by ${combatant.name}`}
            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            disabled={!isDm}
            checked={combatant.usedReaction}
            onChange={(e) => {
              void runAction(
                (prev) =>
                  prev
                    ? applyReactionUsed(prev, combatant.id, e.target.checked)
                    : prev,
                () =>
                  setReactionUsed({
                    campaignId,
                    combatantId: combatant.id,
                    used: e.target.checked,
                  })
              );
            }}
          />
        </div>
      </div>
    </>
  );
}
