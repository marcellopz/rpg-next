"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { isCampaignDm } from "@/lib/campaign/permissions";
import type { ActionResult } from "@/app/actions/campaigns";
import type { CombatantType } from "@/lib/combat/types";

const NAME_MAX = 80;
const STAT_MAX = 10_000;

async function revalidateCampaignWorkspace(campaignId: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("public_code")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaign?.public_code)
    revalidatePath(`/campaigns/${campaign.public_code}`);
}

async function assertDm(campaignId: string): Promise<ActionResult<never> | null> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await isCampaignDm(user.id, campaignId)))
    return { ok: false, error: "Only the DM can edit combat." };
  return null;
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required.";
  if (trimmed.length > NAME_MAX)
    return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
}

function validateStat(value: number, label: string): string | null {
  if (!Number.isFinite(value) || value < -STAT_MAX || value > STAT_MAX)
    return `${label} must be between -${STAT_MAX} and ${STAT_MAX}.`;
  return null;
}

function isCombatantType(value: string): value is CombatantType {
  return ["player", "enemy", "ally", "undead"].includes(value);
}

async function getCombatantCount(campaignId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("combat_combatants")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  return count ?? 0;
}

async function loadCombatants(campaignId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("combat_combatants")
    .select("id, order_index")
    .eq("campaign_id", campaignId)
    .order("order_index");
  return data ?? [];
}

export async function startCombat(campaignId: string): Promise<ActionResult> {
  const denied = await assertDm(campaignId);
  if (denied) return denied;

  const user = await getCurrentUser();
  const admin = createAdminClient();

  const { error } = await admin.from("combat_sessions").upsert(
    {
      campaign_id: campaignId,
      active: true,
      round: 0,
      turn: 0,
      dm_notes: "",
      show_hp_to_players: false,
      started_by: user!.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id" }
  );

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(campaignId);
  return { ok: true, data: undefined };
}

export async function endCombat(input: {
  campaignId: string;
  keepPlayers: boolean;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();

  if (!input.keepPlayers) {
    await admin.from("combat_conditions").delete().eq("campaign_id", input.campaignId);
    await admin.from("combat_combatants").delete().eq("campaign_id", input.campaignId);
    await admin.from("combat_sessions").delete().eq("campaign_id", input.campaignId);
    await revalidateCampaignWorkspace(input.campaignId);
    return { ok: true, data: undefined };
  }

  const { data: playerIds } = await admin
    .from("combat_combatants")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .neq("combatant_type", "player");

  const removeIds = (playerIds ?? []).map((r) => r.id);
  if (removeIds.length > 0) {
    await admin.from("combat_conditions").delete().in("combatant_id", removeIds);
    await admin.from("combat_combatants").delete().in("id", removeIds);
  }

  const remaining = await loadCombatants(input.campaignId);
  for (let i = 0; i < remaining.length; i++) {
    await admin
      .from("combat_combatants")
      .update({ order_index: i })
      .eq("id", remaining[i].id);
  }

  const { error } = await admin
    .from("combat_sessions")
    .update({
      active: false,
      round: 0,
      turn: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function updateDmNotes(input: {
  campaignId: string;
  notes: string;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_sessions")
    .update({
      dm_notes: input.notes.slice(0, 5000),
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function setShowHpToPlayers(input: {
  campaignId: string;
  show: boolean;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_sessions")
    .update({
      show_hp_to_players: input.show,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function addCombatant(input: {
  campaignId: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  combatantType: CombatantType;
  visible: boolean;
  nameHidden: boolean;
  alias?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const nameErr = validateName(input.name);
  if (nameErr) return { ok: false, error: nameErr };
  for (const [val, label] of [
    [input.initiative, "Initiative"],
    [input.hp, "HP"],
    [input.maxHp, "Max HP"],
    [input.ac, "AC"],
  ] as const) {
    const err = validateStat(val, label);
    if (err) return { ok: false, error: err };
  }
  if (!isCombatantType(input.combatantType))
    return { ok: false, error: "Invalid combatant type." };

  const orderIndex = await getCombatantCount(input.campaignId);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("combat_combatants")
    .insert({
      campaign_id: input.campaignId,
      name: input.name.trim(),
      initiative: input.initiative,
      hp: input.hp,
      max_hp: input.maxHp,
      ac: input.ac,
      combatant_type: input.combatantType,
      order_index: orderIndex,
      visible: input.visible,
      name_hidden: input.nameHidden,
      alias: input.nameHidden ? input.alias?.trim() || null : null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: { id: data.id } };
}

export async function updateCombatant(input: {
  campaignId: string;
  combatantId: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  combatantType: CombatantType;
  visible: boolean;
  nameHidden: boolean;
  alias?: string | null;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const nameErr = validateName(input.name);
  if (nameErr) return { ok: false, error: nameErr };

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_combatants")
    .update({
      name: input.name.trim(),
      initiative: input.initiative,
      hp: input.hp,
      max_hp: input.maxHp,
      ac: input.ac,
      combatant_type: input.combatantType,
      visible: input.visible,
      name_hidden: input.nameHidden,
      alias: input.nameHidden ? input.alias?.trim() || null : null,
    })
    .eq("id", input.combatantId)
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function deleteCombatant(input: {
  campaignId: string;
  combatantId: string;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  await admin
    .from("combat_conditions")
    .delete()
    .eq("combatant_id", input.combatantId);
  const { error } = await admin
    .from("combat_combatants")
    .delete()
    .eq("id", input.combatantId)
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };

  const remaining = await loadCombatants(input.campaignId);
  for (let i = 0; i < remaining.length; i++) {
    await admin
      .from("combat_combatants")
      .update({ order_index: i })
      .eq("id", remaining[i].id);
  }

  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function updateCombatantHp(input: {
  campaignId: string;
  combatantId: string;
  hp: number;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const err = validateStat(input.hp, "HP");
  if (err) return { ok: false, error: err };

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_combatants")
    .update({ hp: input.hp })
    .eq("id", input.combatantId)
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function reorderCombatants(input: {
  campaignId: string;
  orderedIds: string[];
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  for (let i = 0; i < input.orderedIds.length; i++) {
    const { error } = await admin
      .from("combat_combatants")
      .update({ order_index: i })
      .eq("id", input.orderedIds[i])
      .eq("campaign_id", input.campaignId);
    if (error) return { ok: false, error: error.message };
  }

  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function sortByInitiative(campaignId: string): Promise<ActionResult> {
  const denied = await assertDm(campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("combat_combatants")
    .select("id, initiative")
    .eq("campaign_id", campaignId)
    .order("initiative", { ascending: false });

  if (!rows) return { ok: true, data: undefined };

  for (let i = 0; i < rows.length; i++) {
    const { error } = await admin
      .from("combat_combatants")
      .update({ order_index: i })
      .eq("id", rows[i].id);
    if (error) return { ok: false, error: error.message };
  }

  await revalidateCampaignWorkspace(campaignId);
  return { ok: true, data: undefined };
}

export async function setRound(input: {
  campaignId: string;
  round: number;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_sessions")
    .update({
      round: input.round,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function resetRound(campaignId: string): Promise<ActionResult> {
  const denied = await assertDm(campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_sessions")
    .update({
      round: 0,
      turn: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(campaignId);
  return { ok: true, data: undefined };
}

export async function setTurn(input: {
  campaignId: string;
  turn: number;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_sessions")
    .update({
      turn: input.turn,
      updated_at: new Date().toISOString(),
    })
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

async function tickConditionsForTurn(
  campaignId: string,
  turn: number
): Promise<void> {
  const admin = createAdminClient();
  const { data: combatant } = await admin
    .from("combat_combatants")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("order_index", turn)
    .maybeSingle();

  if (!combatant) return;

  const { data: conditions } = await admin
    .from("combat_conditions")
    .select("id, duration")
    .eq("combatant_id", combatant.id);

  for (const condition of conditions ?? []) {
    if (condition.duration === -1) continue;
    if (condition.duration <= 1) {
      await admin.from("combat_conditions").delete().eq("id", condition.id);
    } else {
      await admin
        .from("combat_conditions")
        .update({ duration: condition.duration - 1 })
        .eq("id", condition.id);
    }
  }
}

async function resetReactionForTurn(
  campaignId: string,
  turn: number
): Promise<void> {
  const admin = createAdminClient();
  const { data: combatant } = await admin
    .from("combat_combatants")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("order_index", turn)
    .maybeSingle();

  if (!combatant) return;

  await admin
    .from("combat_combatants")
    .update({ used_reaction: false })
    .eq("id", combatant.id);
}

export async function advanceTurn(campaignId: string): Promise<ActionResult> {
  const denied = await assertDm(campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("combat_sessions")
    .select("round, turn")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (!session) return { ok: false, error: "No active combat." };

  const count = await getCombatantCount(campaignId);
  if (count === 0) return { ok: false, error: "No combatants." };

  await tickConditionsForTurn(campaignId, session.turn);

  const newTurn = session.turn + 1;
  if (newTurn >= count) {
    await admin
      .from("combat_sessions")
      .update({
        round: session.round + 1,
        turn: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);
    await resetReactionForTurn(campaignId, 0);
  } else {
    await admin
      .from("combat_sessions")
      .update({
        turn: newTurn,
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);
    await resetReactionForTurn(campaignId, newTurn);
  }

  await revalidateCampaignWorkspace(campaignId);
  return { ok: true, data: undefined };
}

export async function retreatTurn(campaignId: string): Promise<ActionResult> {
  const denied = await assertDm(campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("combat_sessions")
    .select("round, turn")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (!session) return { ok: false, error: "No active combat." };

  const count = await getCombatantCount(campaignId);
  const newTurn = session.turn - 1;

  if (newTurn < 0) {
    if (session.round === 0) return { ok: true, data: undefined };
    await admin
      .from("combat_sessions")
      .update({
        round: session.round - 1,
        turn: Math.max(count - 1, 0),
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);
  } else {
    await admin
      .from("combat_sessions")
      .update({
        turn: newTurn,
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId);
  }

  await revalidateCampaignWorkspace(campaignId);
  return { ok: true, data: undefined };
}

export async function setReactionUsed(input: {
  campaignId: string;
  combatantId: string;
  used: boolean;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_combatants")
    .update({ used_reaction: input.used })
    .eq("id", input.combatantId)
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function addCondition(input: {
  campaignId: string;
  combatantId: string;
  name: string;
  duration: number;
  color: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const nameErr = validateName(input.name);
  if (nameErr) return { ok: false, error: nameErr };
  if (!input.color) return { ok: false, error: "Color is required." };

  const admin = createAdminClient();
  const { data: combatant } = await admin
    .from("combat_combatants")
    .select("campaign_id")
    .eq("id", input.combatantId)
    .maybeSingle();

  if (!combatant || combatant.campaign_id !== input.campaignId)
    return { ok: false, error: "Combatant not found." };

  const { error } = await admin.from("combat_conditions").insert({
    campaign_id: input.campaignId,
    combatant_id: input.combatantId,
    name: input.name.trim(),
    duration: input.duration,
    color: input.color,
  });

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

export async function removeCondition(input: {
  campaignId: string;
  conditionId: string;
}): Promise<ActionResult> {
  const denied = await assertDm(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin
    .from("combat_conditions")
    .delete()
    .eq("id", input.conditionId)
    .eq("campaign_id", input.campaignId);

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}
