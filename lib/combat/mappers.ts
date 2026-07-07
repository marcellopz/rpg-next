import type {
  CombatCombatant,
  CombatCondition,
  CombatSession,
  CombatState,
  CombatantType,
} from "@/lib/combat/types";

export function mapSessionRow(row: Record<string, unknown>): CombatSession {
  return {
    campaignId: String(row.campaign_id),
    active: Boolean(row.active),
    round: Number(row.round),
    turn: Number(row.turn),
    dmNotes: String(row.dm_notes ?? ""),
    showHpToPlayers: Boolean(row.show_hp_to_players),
    startedBy: row.started_by ? String(row.started_by) : null,
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapCombatantRow(
  row: Record<string, unknown>
): CombatCombatant {
  return {
    id: String(row.id),
    name: String(row.name),
    initiative: Number(row.initiative),
    hp: Number(row.hp),
    maxHp: Number(row.max_hp),
    ac: Number(row.ac),
    combatantType: row.combatant_type as CombatantType,
    orderIndex: Number(row.order_index),
    usedReaction: Boolean(row.used_reaction),
    visible: Boolean(row.visible),
    nameHidden: Boolean(row.name_hidden),
    alias: row.alias != null ? String(row.alias) : null,
    conditions: [],
  };
}

export function mapConditionRow(
  row: Record<string, unknown>
): CombatCondition & { combatantId: string } {
  return {
    id: String(row.id),
    combatantId: String(row.combatant_id),
    name: String(row.name),
    duration: Number(row.duration),
    color: String(row.color),
  };
}

export function attachConditions(
  combatants: CombatCombatant[],
  conditions: Array<CombatCondition & { combatantId: string }>
): CombatCombatant[] {
  const byCombatant = new Map<string, CombatCondition[]>();
  for (const row of conditions) {
    const { combatantId, ...condition } = row;
    const list = byCombatant.get(combatantId) ?? [];
    list.push(condition);
    byCombatant.set(combatantId, list);
  }
  return combatants.map((c) => ({
    ...c,
    conditions: byCombatant.get(c.id) ?? [],
  }));
}

export function buildCombatState(
  sessionRow: Record<string, unknown>,
  combatantRows: Record<string, unknown>[],
  conditionRows: Record<string, unknown>[]
): CombatState {
  const combatants = attachConditions(
    combatantRows.map(mapCombatantRow),
    conditionRows.map(mapConditionRow)
  );
  return { session: mapSessionRow(sessionRow), combatants };
}
