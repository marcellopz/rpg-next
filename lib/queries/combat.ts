import { createServerClient } from "@/lib/supabase/server";
import type {
  CombatCombatant,
  CombatCondition,
  CombatSession,
  CombatState,
  CombatantType,
} from "@/lib/combat/types";

type SessionRow = {
  campaign_id: string;
  active: boolean;
  round: number;
  turn: number;
  dm_notes: string;
  show_hp_to_players: boolean;
  started_by: string | null;
  updated_at: string;
};

type CombatantRow = {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  max_hp: number;
  ac: number;
  combatant_type: CombatantType;
  order_index: number;
  used_reaction: boolean;
  visible: boolean;
  name_hidden: boolean;
  alias: string | null;
};

type ConditionRow = {
  id: string;
  combatant_id: string;
  name: string;
  duration: number;
  color: string;
};

export async function getCombatForCampaign(
  campaignId: string
): Promise<CombatState | null> {
  const supabase = createServerClient();

  const { data: sessionRow } = await supabase
    .from("combat_sessions")
    .select(
      "campaign_id, active, round, turn, dm_notes, show_hp_to_players, started_by, updated_at"
    )
    .eq("campaign_id", campaignId)
    .maybeSingle<SessionRow>();

  if (!sessionRow) return null;

  const [{ data: combatantRows }, { data: conditionRows }] = await Promise.all([
    supabase
      .from("combat_combatants")
      .select(
        "id, name, initiative, hp, max_hp, ac, combatant_type, order_index, used_reaction, visible, name_hidden, alias"
      )
      .eq("campaign_id", campaignId)
      .order("order_index")
      .order("created_at")
      .returns<CombatantRow[]>(),
    supabase
      .from("combat_conditions")
      .select("id, combatant_id, name, duration, color")
      .eq("campaign_id", campaignId)
      .returns<ConditionRow[]>(),
  ]);

  const conditionsByCombatant = new Map<string, CombatCondition[]>();
  for (const row of conditionRows ?? []) {
    const list = conditionsByCombatant.get(row.combatant_id) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      duration: row.duration,
      color: row.color,
    });
    conditionsByCombatant.set(row.combatant_id, list);
  }

  const session: CombatSession = {
    campaignId: sessionRow.campaign_id,
    active: sessionRow.active,
    round: sessionRow.round,
    turn: sessionRow.turn,
    dmNotes: sessionRow.dm_notes,
    showHpToPlayers: sessionRow.show_hp_to_players,
    startedBy: sessionRow.started_by,
    updatedAt: sessionRow.updated_at,
  };

  const combatants: CombatCombatant[] = (combatantRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    initiative: row.initiative,
    hp: row.hp,
    maxHp: row.max_hp,
    ac: row.ac,
    combatantType: row.combatant_type,
    orderIndex: row.order_index,
    usedReaction: row.used_reaction,
    visible: row.visible,
    nameHidden: row.name_hidden,
    alias: row.alias,
    conditions: conditionsByCombatant.get(row.id) ?? [],
  }));

  return { session, combatants };
}
