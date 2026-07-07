import { createClient } from "@/lib/supabase/client";
import {
  buildCombatState,
  mapCombatantRow,
  mapConditionRow,
  mapSessionRow,
} from "@/lib/combat/mappers";
import type { CombatState } from "@/lib/combat/types";

export async function fetchCombatClient(
  campaignId: string
): Promise<CombatState | null> {
  const supabase = createClient();

  const { data: sessionRow } = await supabase
    .from("combat_sessions")
    .select(
      "campaign_id, active, round, turn, dm_notes, show_hp_to_players, started_by, updated_at"
    )
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (!sessionRow) return null;

  const [{ data: combatantRows }, { data: conditionRows }] = await Promise.all([
    supabase
      .from("combat_combatants")
      .select(
        "id, name, initiative, hp, max_hp, ac, combatant_type, order_index, used_reaction, visible, name_hidden, alias"
      )
      .eq("campaign_id", campaignId)
      .order("order_index")
      .order("created_at"),
    supabase
      .from("combat_conditions")
      .select("id, combatant_id, name, duration, color")
      .eq("campaign_id", campaignId),
  ]);

  return buildCombatState(
    sessionRow,
    combatantRows ?? [],
    conditionRows ?? []
  );
}

export type CombatRealtimePatch =
  | { type: "session_upsert"; row: Record<string, unknown> }
  | { type: "session_delete" }
  | { type: "combatant_insert"; row: Record<string, unknown> }
  | { type: "combatant_update"; row: Record<string, unknown> }
  | { type: "combatant_delete"; id: string }
  | { type: "condition_insert"; row: Record<string, unknown> }
  | { type: "condition_update"; row: Record<string, unknown> }
  | { type: "condition_delete"; id: string };

export function patchCombatState(
  prev: CombatState | null,
  patch: CombatRealtimePatch
): CombatState | null {
  switch (patch.type) {
    case "session_delete":
      return null;
    case "session_upsert": {
      const session = mapSessionRow(patch.row);
      if (!prev) {
        return { session, combatants: [] };
      }
      return { ...prev, session };
    }
    case "combatant_insert": {
      if (!prev) return null;
      const combatant = mapCombatantRow(patch.row);
      if (prev.combatants.some((c) => c.id === combatant.id)) return prev;
      return {
        ...prev,
        combatants: [...prev.combatants, combatant].sort(
          (a, b) => a.orderIndex - b.orderIndex
        ),
      };
    }
    case "combatant_update": {
      if (!prev) return null;
      const updated = mapCombatantRow(patch.row);
      return {
        ...prev,
        combatants: prev.combatants
          .map((c) =>
            c.id === updated.id
              ? { ...updated, conditions: c.conditions }
              : c
          )
          .sort((a, b) => a.orderIndex - b.orderIndex),
      };
    }
    case "combatant_delete": {
      if (!prev) return null;
      return {
        ...prev,
        combatants: prev.combatants.filter((c) => c.id !== patch.id),
      };
    }
    case "condition_insert": {
      if (!prev) return null;
      const mapped = mapConditionRow(patch.row);
      const { combatantId, ...condition } = mapped;
      return {
        ...prev,
        combatants: prev.combatants.map((c) =>
          c.id === combatantId
            ? {
                ...c,
                conditions: c.conditions.some((x) => x.id === condition.id)
                  ? c.conditions
                  : [...c.conditions, condition],
              }
            : c
        ),
      };
    }
    case "condition_update": {
      if (!prev) return null;
      const mapped = mapConditionRow(patch.row);
      const { combatantId, ...condition } = mapped;
      return {
        ...prev,
        combatants: prev.combatants.map((c) =>
          c.id === combatantId
            ? {
                ...c,
                conditions: c.conditions.map((x) =>
                  x.id === condition.id ? condition : x
                ),
              }
            : c
        ),
      };
    }
    case "condition_delete": {
      if (!prev) return null;
      return {
        ...prev,
        combatants: prev.combatants.map((c) => ({
          ...c,
          conditions: c.conditions.filter((x) => x.id !== patch.id),
        })),
      };
    }
    default:
      return prev;
  }
}
