import type { CombatCombatant } from "@/lib/combat/types";

export type HpColorClass =
  | "hp-healthy"
  | "hp-hurt"
  | "hp-bloodied"
  | "hp-critical"
  | "hp-undead";

export function getHpColorClass(combatant: Pick<CombatCombatant, "hp" | "maxHp" | "combatantType">): HpColorClass {
  if (combatant.combatantType === "undead") {
    return "hp-undead";
  }
  const pct = combatant.maxHp > 0 ? (combatant.hp / combatant.maxHp) * 100 : 0;
  if (pct > 75) return "hp-healthy";
  if (pct > 50) return "hp-hurt";
  if (pct > 25) return "hp-bloodied";
  return "hp-critical";
}

export function getDisplayName(
  combatant: Pick<
    CombatCombatant,
    "name" | "nameHidden" | "alias" | "visible"
  >,
  isDm: boolean
): string {
  if (isDm) {
    if (combatant.nameHidden && combatant.alias) {
      return `${combatant.alias} (${combatant.name})`;
    }
    return combatant.name;
  }
  return combatant.nameHidden && combatant.alias ? combatant.alias : combatant.name;
}

/** Resolve turn index for non-DMs, skipping invisible combatants. */
export function resolveTurnForViewer(
  turn: number,
  combatants: Pick<CombatCombatant, "orderIndex" | "visible">[],
  isDm: boolean
): number {
  if (isDm) return turn;
  if (turn !== 0 && !turn) return -1;

  const sorted = [...combatants].sort((a, b) => a.orderIndex - b.orderIndex);
  const findRecursive = (idx: number): number => {
    const match = sorted.find((c) => c.orderIndex === idx);
    if (!match) return -1;
    if (match.visible === false) {
      if (idx === 0) {
        const maxIndex = Math.max(...sorted.map((c) => c.orderIndex), 0);
        return findRecursive(maxIndex);
      }
      return findRecursive(idx - 1);
    }
    return idx;
  };
  return findRecursive(turn);
}
