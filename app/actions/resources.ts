"use server";

// No revalidatePath here: the workspace page is fully dynamic, callers apply
// the change locally (optimistic) and other members are refreshed by the
// resources realtime channel — server-side revalidation would only re-render
// the page a second time inside the action response.
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { isCampaignMember } from "@/lib/queries/campaigns";
import type { ActionResult } from "@/app/actions/campaigns";
import {
  appendCardToLayouts,
  removeCardFromLayouts,
} from "@/lib/resources/layout-mutations.server";
import type { DashboardLayouts } from "@/lib/resources/types";

const NAME_MAX = 80;
const VALUE_MAX = 1_000_000;

function validateName(name: string, label: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > NAME_MAX)
    return `${label} must be ${NAME_MAX} characters or fewer.`;
  return null;
}

function validateValue(value: number, label: string): string | null {
  if (!Number.isFinite(value) || value < 0 || value > VALUE_MAX)
    return `${label} must be between 0 and ${VALUE_MAX}.`;
  return null;
}

async function getCardCampaignId(cardId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("resource_cards")
    .select("campaign_id")
    .eq("id", cardId)
    .maybeSingle();
  return data?.campaign_id ?? null;
}

async function assertMember(campaignId: string): Promise<ActionResult<never> | null> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!(await isCampaignMember(user.id, campaignId)))
    return { ok: false, error: "You do not have access to this campaign." };
  return null;
}

async function loadLayouts(campaignId: string): Promise<DashboardLayouts> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("resource_dashboard_layouts")
    .select("layouts")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  return (data?.layouts as DashboardLayouts | undefined) ?? {};
}

async function saveLayouts(
  campaignId: string,
  layouts: DashboardLayouts
): Promise<string | null> {
  const admin = createAdminClient();
  const { error } = await admin.from("resource_dashboard_layouts").upsert(
    {
      campaign_id: campaignId,
      layouts,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id" }
  );
  return error?.message ?? null;
}

export async function createResourceCard(input: {
  campaignId: string;
  name?: string;
  characterId?: string;
}): Promise<ActionResult<{ id: string }>> {
  const denied = await assertMember(input.campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  let name = input.name?.trim() ?? "";

  if (input.characterId) {
    const { data: character } = await admin
      .from("characters")
      .select("id, name, campaign_id")
      .eq("id", input.characterId)
      .maybeSingle();
    if (!character || character.campaign_id !== input.campaignId)
      return { ok: false, error: "Character not found." };

    const { data: existing } = await admin
      .from("resource_cards")
      .select("id")
      .eq("campaign_id", input.campaignId)
      .eq("character_id", input.characterId)
      .maybeSingle();
    if (existing)
      return { ok: false, error: "That character already has a resource card." };

    name = character.name;
  }

  const nameError = validateName(name, "Card name");
  if (nameError) return { ok: false, error: nameError };

  const { data: card, error } = await admin
    .from("resource_cards")
    .insert({
      campaign_id: input.campaignId,
      character_id: input.characterId ?? null,
      name,
    })
    .select("id")
    .single();
  if (error || !card) {
    return {
      ok: false,
      error: error?.message ?? "Could not create card.",
    };
  }

  const layouts = appendCardToLayouts(
    await loadLayouts(input.campaignId),
    card.id
  );
  const layoutError = await saveLayouts(input.campaignId, layouts);
  if (layoutError) {
    await admin.from("resource_cards").delete().eq("id", card.id);
    return { ok: false, error: `Could not save card layout: ${layoutError}` };
  }

  return { ok: true, data: { id: card.id } };
}

export async function deleteResourceCard(
  cardId: string
): Promise<ActionResult> {
  const campaignId = await getCardCampaignId(cardId);
  if (!campaignId) return { ok: false, error: "Card not found." };

  const denied = await assertMember(campaignId);
  if (denied) return denied;

  const admin = createAdminClient();
  const { error } = await admin.from("resource_cards").delete().eq("id", cardId);
  if (error) return { ok: false, error: "Could not delete card." };

  const layouts = removeCardFromLayouts(await loadLayouts(campaignId), cardId);
  const layoutError = await saveLayouts(campaignId, layouts);
  if (layoutError) return { ok: false, error: layoutError };
  return { ok: true, data: undefined };
}

export async function renameResourceCard(input: {
  cardId: string;
  name: string;
}): Promise<ActionResult> {
  const campaignId = await getCardCampaignId(input.cardId);
  if (!campaignId) return { ok: false, error: "Card not found." };

  const denied = await assertMember(campaignId);
  if (denied) return denied;

  const nameError = validateName(input.name, "Card name");
  if (nameError) return { ok: false, error: nameError };

  const admin = createAdminClient();
  const { error } = await admin
    .from("resource_cards")
    .update({ name: input.name.trim() })
    .eq("id", input.cardId);
  if (error) return { ok: false, error: "Could not rename card." };

  return { ok: true, data: undefined };
}

export async function addResourceItem(input: {
  cardId: string;
  name: string;
  currentValue?: number;
  totalValue?: number;
}): Promise<ActionResult<{ id: string }>> {
  const campaignId = await getCardCampaignId(input.cardId);
  if (!campaignId) return { ok: false, error: "Card not found." };

  const denied = await assertMember(campaignId);
  if (denied) return denied;

  const nameError = validateName(input.name, "Resource name");
  if (nameError) return { ok: false, error: nameError };

  const current = input.currentValue ?? 0;
  const total = input.totalValue ?? 1;
  const currentError = validateValue(current, "Current value");
  if (currentError) return { ok: false, error: currentError };
  const totalError = validateValue(total, "Total value");
  if (totalError) return { ok: false, error: totalError };

  const admin = createAdminClient();
  const { data: last } = await admin
    .from("resource_items")
    .select("sort_order")
    .eq("card_id", input.cardId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: item, error } = await admin
    .from("resource_items")
    .insert({
      campaign_id: campaignId,
      card_id: input.cardId,
      name: input.name.trim(),
      current_value: current,
      total_value: total,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();
  if (error || !item) return { ok: false, error: "Could not add resource." };

  return { ok: true, data: { id: item.id } };
}

export async function deleteResourceItem(itemId: string): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("resource_items")
    .select("campaign_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return { ok: false, error: "Resource not found." };

  const denied = await assertMember(item.campaign_id);
  if (denied) return denied;

  const { error } = await admin
    .from("resource_items")
    .delete()
    .eq("id", itemId);
  if (error) return { ok: false, error: "Could not delete resource." };

  return { ok: true, data: undefined };
}

export async function updateResourceItem(input: {
  itemId: string;
  name?: string;
  totalValue?: number;
  currentValue?: number;
}): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("resource_items")
    .select("campaign_id, total_value")
    .eq("id", input.itemId)
    .maybeSingle();
  if (!item) return { ok: false, error: "Resource not found." };

  const denied = await assertMember(item.campaign_id);
  if (denied) return denied;

  const patch: Record<string, string | number> = {};
  if (input.name !== undefined) {
    const nameError = validateName(input.name, "Resource name");
    if (nameError) return { ok: false, error: nameError };
    patch.name = input.name.trim();
  }
  if (input.totalValue !== undefined) {
    const totalError = validateValue(input.totalValue, "Total value");
    if (totalError) return { ok: false, error: totalError };
    patch.total_value = input.totalValue;
  }
  if (input.currentValue !== undefined) {
    const currentError = validateValue(input.currentValue, "Current value");
    if (currentError) return { ok: false, error: currentError };
    const total = (patch.total_value as number | undefined) ?? item.total_value;
    if (input.currentValue > total)
      return { ok: false, error: "Current cannot exceed total." };
    patch.current_value = input.currentValue;
  }

  if (Object.keys(patch).length === 0) return { ok: true, data: undefined };

  const { error } = await admin
    .from("resource_items")
    .update(patch)
    .eq("id", input.itemId);
  if (error) return { ok: false, error: "Could not update resource." };

  return { ok: true, data: undefined };
}

// Persist a drag-reorder of a card's resource list: sort_order = list index.
export async function reorderResourceItems(input: {
  cardId: string;
  orderedIds: string[];
}): Promise<ActionResult> {
  const admin = createAdminClient();

  // The card lookup and the item-id fetch don't depend on each other, so run
  // them together instead of paying two sequential round trips.
  const [{ data: card }, { data: rows }] = await Promise.all([
    admin
      .from("resource_cards")
      .select("campaign_id")
      .eq("id", input.cardId)
      .maybeSingle(),
    admin.from("resource_items").select("id").eq("card_id", input.cardId),
  ]);

  if (!card?.campaign_id) return { ok: false, error: "Card not found." };

  const denied = await assertMember(card.campaign_id);
  if (denied) return denied;

  const validIds = new Set((rows ?? []).map((r) => r.id));
  if (!input.orderedIds.every((id) => validIds.has(id)))
    return { ok: false, error: "The resource list is out of date. Reload and try again." };

  const updates = input.orderedIds.map((id, index) =>
    admin.from("resource_items").update({ sort_order: index + 1 }).eq("id", id)
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error))
    return { ok: false, error: "Could not reorder the resources. Please try again." };

  return { ok: true, data: undefined };
}

export async function setResourceCurrent(input: {
  itemId: string;
  currentValue: number;
}): Promise<ActionResult> {
  return updateResourceItem({
    itemId: input.itemId,
    currentValue: input.currentValue,
  });
}

export async function saveResourceLayouts(input: {
  campaignId: string;
  layouts: DashboardLayouts;
}): Promise<ActionResult> {
  const denied = await assertMember(input.campaignId);
  if (denied) return denied;

  const layoutError = await saveLayouts(input.campaignId, input.layouts);
  if (layoutError) return { ok: false, error: layoutError };

  return { ok: true, data: undefined };
}
