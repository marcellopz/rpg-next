// Read-side data access for the inventory tool. User-scoped client: RLS
// (is_member) hides other campaigns' characters, items, and log entries.
import { createServerClient } from "@/lib/supabase/server";

import type { InventoryItemType } from "@/lib/inventory/item-types";

export type { InventoryItemType };

export type InventoryItem = {
  id: string;
  characterId: string;
  name: string;
  itemType: InventoryItemType;
  weight: number; // per-unit weight in lb
  quantity: number;
};

export type Character = {
  id: string;
  name: string;
  strength: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  items: InventoryItem[];
};

type CharacterRow = {
  id: string;
  name: string;
  strength: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
};

type ItemRow = {
  id: string;
  character_id: string;
  name: string;
  item_type: InventoryItemType;
  weight: number;
  quantity: number;
};

// All party characters (in sidebar order) with their items (in list order).
export async function getInventoryForCampaign(
  campaignId: string
): Promise<Character[]> {
  const supabase = createServerClient();

  const [{ data: characterRows }, { data: itemRows }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, strength, platinum, gold, silver, copper")
      .eq("campaign_id", campaignId)
      .order("sort_order")
      .order("created_at")
      .returns<CharacterRow[]>(),
    supabase
      .from("inventory_items")
      .select("id, character_id, name, item_type, weight, quantity")
      .eq("campaign_id", campaignId)
      .order("sort_order")
      .order("created_at")
      .returns<ItemRow[]>(),
  ]);

  const itemsByCharacter = new Map<string, InventoryItem[]>();
  for (const row of itemRows ?? []) {
    const list = itemsByCharacter.get(row.character_id) ?? [];
    list.push({
      id: row.id,
      characterId: row.character_id,
      name: row.name,
      itemType: row.item_type,
      weight: Number(row.weight),
      quantity: row.quantity,
    });
    itemsByCharacter.set(row.character_id, list);
  }

  return (characterRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    strength: c.strength,
    platinum: c.platinum,
    gold: c.gold,
    silver: c.silver,
    copper: c.copper,
    items: itemsByCharacter.get(c.id) ?? [],
  }));
}

export type InventoryLogEntry = {
  id: string;
  actorName: string;
  changeType: string;
  description: string;
  itemSnapshot: Record<string, unknown> | null;
  createdAt: string;
};

// The campaign's inventory change history, newest first.
export async function getInventoryLog(
  campaignId: string,
  limit = 100
): Promise<InventoryLogEntry[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("inventory_log_entries")
    .select("id, actor_name, change_type, description, item_snapshot, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    actorName: row.actor_name,
    changeType: row.change_type,
    description: row.description,
    itemSnapshot: (row.item_snapshot as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at,
  }));
}
