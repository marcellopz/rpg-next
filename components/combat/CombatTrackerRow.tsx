"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { setReactionUsed, updateCombatantHp } from "@/app/actions/combat";
import { getDisplayName, getHpColorClass } from "@/lib/combat/hp-colors";
import {
  applyCombatantHp,
  applyReactionUsed,
} from "@/lib/combat/turn-engine";
import type { CombatCombatant } from "@/lib/combat/types";
import { CombatantStatusIcons } from "@/components/combat/CombatantStatusIcons";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { ConditionChip } from "@/components/combat/ConditionChip";
import { CombatRowContextMenu } from "@/components/combat/CombatRowContextMenu";
import { AddConditionDialog } from "@/components/combat/dialogs/AddConditionDialog";
import { ConfirmDeleteCombatantDialog } from "@/components/combat/dialogs/ConfirmDeleteCombatantDialog";
import { EditCombatantDialog } from "@/components/combat/dialogs/EditCombatantDialog";

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

  useEffect(() => {
    setHp(combatant.hp);
  }, [combatant.hp]);

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
        className={`tracker-table-body-row ${colorClass} ${isTurn ? "turn" : ""} ${
          combatant.visible === false ? "hidden-from-players" : ""
        } ${dragging ? "dragging" : ""}`}
      >
        <div className="tracker-table-initiative">{combatant.initiative}</div>
        <span className="separator" />
        <div className="tracker-table-name">
          <p className="tracker-table-name-text">
            <CombatantStatusIcons combatant={combatant} isDm={isDm} />
            {getDisplayName(combatant, isDm)}
          </p>
          {combatant.conditions.length > 0 && (
            <div>
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
            <span className="separator" />
            <div className="tracker-table-ac">{combatant.ac}</div>
            <span className="separator" />
            <div className="tracker-table-hp">
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
                    <span
                      className="hp-heal"
                      onClick={() => setOpenPlus(true)}
                      role="button"
                      tabIndex={0}
                      aria-label="Heal"
                    >
                      <Plus size={16} aria-hidden />
                    </span>
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
                    <span
                      className="hp-value hp-value-editable"
                      onDoubleClick={() => setEditingHp(true)}
                    >
                      {combatant.hp} / {combatant.maxHp}
                    </span>
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
                    <span
                      className="hp-damage"
                      onClick={() => setOpenMinus(true)}
                      role="button"
                      tabIndex={0}
                      aria-label="Damage"
                    >
                      <Minus size={16} aria-hidden />
                    </span>
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
        <span className="separator" />
        <div className="tracker-table-reaction">
          <input
            type="checkbox"
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
