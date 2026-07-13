"use server";

// Inventory writes are trusted logic: RLS denies client writes, so every
// action verifies campaign membership and then uses the service-role admin
// client. Every mutation (except reorders) also appends a human-readable
// entry to inventory_log_entries — the append-only change history.
import { revalidatePath } from "next/cache";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { isCampaignMember } from "@/lib/queries/campaigns";
import type { ActionResult } from "@/app/actions/campaigns";
import {
  isInventoryItemType,
  type InventoryItemType,
} from "@/lib/inventory/item-types";

const NAME_MAX = 80;
const QUANTITY_MAX = 1_000_000;
const WEIGHT_MAX = 100_000;
const STAT_MAX = 1_000_000_000;

export type CharacterStatField =
  | "strength"
  | "platinum"
  | "gold"
  | "silver"
  | "copper";

export type ItemField = "name" | "itemType" | "weight" | "quantity";

type Actor = { id: string; name: string };

// The current user plus a display label for log entries.
async function getActor(): Promise<Actor | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const name =
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Unknown";
  return { id: user.id, name };
}

function validateName(name: string, label: string): string | null {
  if (!name) return `${label} is required.`;
  if (name.length > NAME_MAX)
    return `${label} must be ${NAME_MAX} characters or fewer.`;
  return null;
}

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

async function writeLog(entry: {
  campaignId: string;
  actor: Actor;
  changeType: string;
  description: string;
  itemSnapshot?: Record<string, unknown> | null;
}) {
  const admin = createAdminClient();
  await admin.from("inventory_log_entries").insert({
    campaign_id: entry.campaignId,
    actor_id: entry.actor.id,
    actor_name: entry.actor.name,
    change_type: entry.changeType,
    description: entry.description,
    item_snapshot: entry.itemSnapshot ?? null,
  });
}

type CharacterRow = {
  id: string;
  campaign_id: string;
  name: string;
  strength: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  image_path: string | null;
};

// Load a character and verify the caller is a member of its campaign.
async function getEditableCharacter(
  characterId: string,
  userId: string
): Promise<{ character: CharacterRow } | { error: string }> {
  const admin = createAdminClient();
  const { data: character } = await admin
    .from("characters")
    .select(
      "id, campaign_id, name, strength, platinum, gold, silver, copper, image_path"
    )
    .eq("id", characterId)
    .maybeSingle<CharacterRow>();
  if (!character) return { error: "Character not found." };

  if (!(await isCampaignMember(userId, character.campaign_id)))
    return { error: "You don't have access to this campaign." };

  return { character };
}

type ItemRow = {
  id: string;
  campaign_id: string;
  character_id: string;
  name: string;
  item_type: InventoryItemType;
  weight: number;
  quantity: number;
};

// Load an item (with its character's name) and verify campaign membership.
async function getEditableItem(
  itemId: string,
  userId: string
): Promise<{ item: ItemRow; characterName: string } | { error: string }> {
  const admin = createAdminClient();
  const { data: item } = await admin
    .from("inventory_items")
    .select("id, campaign_id, character_id, name, item_type, weight, quantity")
    .eq("id", itemId)
    .maybeSingle<ItemRow>();
  if (!item) return { error: "Item not found." };

  if (!(await isCampaignMember(userId, item.campaign_id)))
    return { error: "You don't have access to this campaign." };

  const { data: character } = await admin
    .from("characters")
    .select("name")
    .eq("id", item.character_id)
    .maybeSingle();

  return { item, characterName: character?.name ?? "Unknown" };
}

function itemSnapshot(item: {
  name: string;
  item_type: string;
  weight: number;
  quantity: number;
}): Record<string, unknown> {
  return {
    name: item.name,
    type: item.item_type,
    weight: Number(item.weight),
    quantity: item.quantity,
  };
}

// ---------------------------------------------------------------------------
// Characters

export async function createCharacter(input: {
  campaignId: string;
  name: string;
  strength: number;
  gold: number;
}): Promise<ActionResult<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const name = (input.name ?? "").trim();
  const invalid = validateName(name, "Character name");
  if (invalid) return { ok: false, error: invalid };

  const strength = Math.trunc(input.strength);
  const gold = Math.trunc(input.gold);
  if (!Number.isFinite(strength) || strength < 0 || strength > STAT_MAX)
    return { ok: false, error: "Strength must be a non-negative number." };
  if (!Number.isFinite(gold) || gold < 0 || gold > STAT_MAX)
    return { ok: false, error: "Gold must be a non-negative number." };

  if (!(await isCampaignMember(actor.id, input.campaignId)))
    return { ok: false, error: "You don't have access to this campaign." };

  const admin = createAdminClient();

  // Append at the end of the character list.
  const { data: lastRow } = await admin
    .from("characters")
    .select("sort_order")
    .eq("campaign_id", input.campaignId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (lastRow?.sort_order ?? 0) + 1;

  const { data, error } = await admin
    .from("characters")
    .insert({
      campaign_id: input.campaignId,
      created_by: actor.id,
      name,
      strength,
      gold,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error || !data)
    return { ok: false, error: "Could not create the character. Please try again." };

  await writeLog({
    campaignId: input.campaignId,
    actor,
    changeType: "create_character",
    description: `Added ${name} to the party`,
  });
  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: { id: data.id } };
}

export async function renameCharacter(
  characterId: string,
  name: string
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const trimmed = (name ?? "").trim();
  const invalid = validateName(trimmed, "Character name");
  if (invalid) return { ok: false, error: invalid };

  const result = await getEditableCharacter(characterId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { character } = result;
  if (character.name === trimmed) return { ok: true, data: undefined };

  const admin = createAdminClient();
  const { error } = await admin
    .from("characters")
    .update({ name: trimmed })
    .eq("id", characterId);
  if (error)
    return { ok: false, error: "Could not rename the character. Please try again." };

  await writeLog({
    campaignId: character.campaign_id,
    actor,
    changeType: "rename_character",
    description: `Renamed ${character.name} to ${trimmed}`,
  });
  await revalidateCampaignWorkspace(character.campaign_id);
  return { ok: true, data: undefined };
}

// Deleting a character also deletes its items (FK cascade).
export async function deleteCharacter(
  characterId: string
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const result = await getEditableCharacter(characterId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { character } = result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("characters")
    .delete()
    .eq("id", characterId);
  if (error)
    return { ok: false, error: "Could not delete the character. Please try again." };

  await writeLog({
    campaignId: character.campaign_id,
    actor,
    changeType: "delete_character",
    description: `Removed ${character.name} from the party`,
  });
  await revalidateCampaignWorkspace(character.campaign_id);
  return { ok: true, data: undefined };
}

const STAT_LABELS: Record<CharacterStatField, string> = {
  strength: "strength",
  platinum: "platinum",
  gold: "gold",
  silver: "silver",
  copper: "copper",
};

export async function updateCharacterStat(
  characterId: string,
  field: CharacterStatField,
  value: number
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  if (!(field in STAT_LABELS)) return { ok: false, error: "Unknown field." };
  const amount = Math.trunc(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > STAT_MAX)
    return { ok: false, error: "Value must be a non-negative number." };

  const result = await getEditableCharacter(characterId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { character } = result;

  const previous = character[field];
  if (previous === amount) return { ok: true, data: undefined };

  const admin = createAdminClient();
  const { error } = await admin
    .from("characters")
    .update({ [field]: amount })
    .eq("id", characterId);
  if (error)
    return { ok: false, error: "Could not update the character. Please try again." };

  await writeLog({
    campaignId: character.campaign_id,
    actor,
    changeType: `update_${field}`,
    description: `Changed ${character.name}'s ${STAT_LABELS[field]} from ${previous} to ${amount}`,
  });
  await revalidateCampaignWorkspace(character.campaign_id);
  return { ok: true, data: undefined };
}

// Set or clear a character's photo. The path must point into this campaign's
// portraits folder in the public-assets bucket (the client uploads there
// first). The replaced storage object is deleted best-effort.
export async function updateCharacterImage(
  characterId: string,
  imagePath: string | null
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const result = await getEditableCharacter(characterId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { character } = result;

  if (
    imagePath !== null &&
    !imagePath.startsWith(`${character.campaign_id}/portraits/`)
  )
    return { ok: false, error: "Invalid image path." };
  if (character.image_path === imagePath) return { ok: true, data: undefined };

  const admin = createAdminClient();
  const { error } = await admin
    .from("characters")
    .update({ image_path: imagePath })
    .eq("id", characterId);
  if (error)
    return { ok: false, error: "Could not update the photo. Please try again." };

  if (character.image_path) {
    await admin.storage.from("public-assets").remove([character.image_path]);
  }

  await writeLog({
    campaignId: character.campaign_id,
    actor,
    changeType: "update_photo",
    description: imagePath
      ? `Updated ${character.name}'s photo`
      : `Removed ${character.name}'s photo`,
  });
  await revalidateCampaignWorkspace(character.campaign_id);
  return { ok: true, data: undefined };
}

// Persist a drag-reorder of the character sidebar: sort_order = list index.
// Reorders are intentionally not logged (parity with the old app).
export async function reorderCharacters(input: {
  campaignId: string;
  orderedIds: string[];
}): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  if (!(await isCampaignMember(actor.id, input.campaignId)))
    return { ok: false, error: "You don't have access to this campaign." };

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("characters")
    .select("id")
    .eq("campaign_id", input.campaignId);

  const validIds = new Set((rows ?? []).map((r) => r.id));
  if (!input.orderedIds.every((id) => validIds.has(id)))
    return { ok: false, error: "The character list is out of date. Reload and try again." };

  const updates = input.orderedIds.map((id, index) =>
    admin.from("characters").update({ sort_order: index + 1 }).eq("id", id)
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error))
    return { ok: false, error: "Could not reorder the characters. Please try again." };

  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Items

function validateItemNumbers(
  weight: number,
  quantity: number
): string | null {
  if (!Number.isFinite(weight) || weight < 0 || weight > WEIGHT_MAX)
    return "Weight must be a non-negative number.";
  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > QUANTITY_MAX
  )
    return "Quantity must be a positive whole number.";
  return null;
}

export async function addItem(input: {
  characterId: string;
  name: string;
  itemType: InventoryItemType;
  weight: number;
  quantity: number;
}): Promise<ActionResult<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const name = (input.name ?? "").trim();
  const invalid =
    validateName(name, "Item name") ??
    validateItemNumbers(input.weight, input.quantity);
  if (invalid) return { ok: false, error: invalid };
  if (!isInventoryItemType(input.itemType))
    return { ok: false, error: "Unknown item type." };

  const result = await getEditableCharacter(input.characterId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { character } = result;

  const admin = createAdminClient();

  // Append at the end of the character's item list.
  const { data: lastRow } = await admin
    .from("inventory_items")
    .select("sort_order")
    .eq("character_id", input.characterId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (lastRow?.sort_order ?? 0) + 1;

  const { data, error } = await admin
    .from("inventory_items")
    .insert({
      campaign_id: character.campaign_id,
      character_id: input.characterId,
      name,
      item_type: input.itemType,
      weight: input.weight,
      quantity: input.quantity,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error || !data)
    return { ok: false, error: "Could not add the item. Please try again." };

  await writeLog({
    campaignId: character.campaign_id,
    actor,
    changeType: "add",
    description: `Added ${input.quantity} × "${name}" to ${character.name}'s inventory`,
    itemSnapshot: {
      name,
      type: input.itemType,
      weight: input.weight,
      quantity: input.quantity,
    },
  });
  await revalidateCampaignWorkspace(character.campaign_id);
  return { ok: true, data: { id: data.id } };
}

export async function deleteItem(itemId: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const result = await getEditableItem(itemId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { item, characterName } = result;

  const admin = createAdminClient();
  const { error } = await admin
    .from("inventory_items")
    .delete()
    .eq("id", itemId);
  if (error)
    return { ok: false, error: "Could not delete the item. Please try again." };

  await writeLog({
    campaignId: item.campaign_id,
    actor,
    changeType: "delete",
    description: `Removed ${item.quantity} × "${item.name}" from ${characterName}'s inventory`,
    itemSnapshot: itemSnapshot(item),
  });
  await revalidateCampaignWorkspace(item.campaign_id);
  return { ok: true, data: undefined };
}

export async function updateItem(
  itemId: string,
  field: ItemField,
  value: string | number
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const result = await getEditableItem(itemId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { item, characterName } = result;

  let update: Record<string, string | number>;
  let changeType: string;
  let description: string;

  if (field === "name") {
    const name = String(value ?? "").trim();
    const invalid = validateName(name, "Item name");
    if (invalid) return { ok: false, error: invalid };
    if (name === item.name) return { ok: true, data: undefined };
    update = { name };
    changeType = "update_item_name";
    description = `Renamed "${item.name}" to "${name}" in ${characterName}'s inventory`;
  } else if (field === "itemType") {
    const itemType = value as InventoryItemType;
    if (!isInventoryItemType(itemType))
      return { ok: false, error: "Unknown item type." };
    if (itemType === item.item_type) return { ok: true, data: undefined };
    update = { item_type: itemType };
    changeType = "update_item_type";
    description = `Changed "${item.name}" from ${item.item_type} to ${itemType} in ${characterName}'s inventory`;
  } else if (field === "weight") {
    const weight = Number(value);
    if (!Number.isFinite(weight) || weight < 0 || weight > WEIGHT_MAX)
      return { ok: false, error: "Weight must be a non-negative number." };
    if (weight === Number(item.weight)) return { ok: true, data: undefined };
    update = { weight };
    changeType = "update_weight";
    description = `Changed "${item.name}" weight from ${Number(item.weight)} lb to ${weight} lb in ${characterName}'s inventory`;
  } else if (field === "quantity") {
    const quantity = Number(value);
    const invalid = validateItemNumbers(0, quantity);
    if (invalid) return { ok: false, error: invalid };
    if (quantity === item.quantity) return { ok: true, data: undefined };
    update = { quantity };
    changeType = "update_number_of_items";
    description = `Changed "${item.name}" quantity from ${item.quantity} to ${quantity} in ${characterName}'s inventory`;
  } else {
    return { ok: false, error: "Unknown field." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("inventory_items")
    .update(update)
    .eq("id", itemId);
  if (error)
    return { ok: false, error: "Could not update the item. Please try again." };

  await writeLog({
    campaignId: item.campaign_id,
    actor,
    changeType,
    description,
  });
  await revalidateCampaignWorkspace(item.campaign_id);
  return { ok: true, data: undefined };
}

// Move an item to another character in the same campaign. A single "transfer"
// log entry (the old app logged a delete + add pair instead).
export async function transferItem(
  itemId: string,
  targetCharacterId: string
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const result = await getEditableItem(itemId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { item, characterName } = result;

  if (targetCharacterId === item.character_id)
    return { ok: true, data: undefined };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("characters")
    .select("id, campaign_id, name")
    .eq("id", targetCharacterId)
    .maybeSingle();
  if (!target || target.campaign_id !== item.campaign_id)
    return { ok: false, error: "Target character not found." };

  // Append at the end of the target's item list.
  const { data: lastRow } = await admin
    .from("inventory_items")
    .select("sort_order")
    .eq("character_id", targetCharacterId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = (lastRow?.sort_order ?? 0) + 1;

  const { error } = await admin
    .from("inventory_items")
    .update({ character_id: targetCharacterId, sort_order: sortOrder })
    .eq("id", itemId);
  if (error)
    return { ok: false, error: "Could not transfer the item. Please try again." };

  await writeLog({
    campaignId: item.campaign_id,
    actor,
    changeType: "transfer",
    description: `Moved ${item.quantity} × "${item.name}" from ${characterName} to ${target.name}`,
    itemSnapshot: itemSnapshot(item),
  });
  await revalidateCampaignWorkspace(item.campaign_id);
  return { ok: true, data: undefined };
}

// Persist a drag-reorder of a character's item list: sort_order = list index.
// Reorders are intentionally not logged (parity with the old app).
export async function reorderItems(input: {
  characterId: string;
  orderedIds: string[];
}): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "You must be signed in." };

  const result = await getEditableCharacter(input.characterId, actor.id);
  if ("error" in result) return { ok: false, error: result.error };
  const { character } = result;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("inventory_items")
    .select("id")
    .eq("character_id", input.characterId);

  const validIds = new Set((rows ?? []).map((r) => r.id));
  if (!input.orderedIds.every((id) => validIds.has(id)))
    return { ok: false, error: "The item list is out of date. Reload and try again." };

  const updates = input.orderedIds.map((id, index) =>
    admin.from("inventory_items").update({ sort_order: index + 1 }).eq("id", id)
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error))
    return { ok: false, error: "Could not reorder the items. Please try again." };

  await revalidateCampaignWorkspace(character.campaign_id);
  return { ok: true, data: undefined };
}
