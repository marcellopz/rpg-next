import { createClient } from "@/lib/supabase/client";
import type {
  Character,
  InventoryItem,
  InventoryLogEntry,
} from "@/lib/queries/inventory";
import type { InventoryItemType } from "@/lib/inventory/item-types";

// Browser-side re-reads mirroring lib/queries/inventory.ts. Used to reconcile
// after an optimistic mutation and to pick up other members' changes over
// realtime — one targeted query set instead of router.refresh(), which would
// re-render the whole workspace.

type CharacterRow = {
  id: string;
  name: string;
  strength: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  image_path: string | null;
};

type ItemRow = {
  id: string;
  character_id: string;
  name: string;
  item_type: InventoryItemType;
  weight: number;
  quantity: number;
};

export async function fetchInventoryCharactersClient(
  campaignId: string
): Promise<Character[]> {
  const supabase = createClient();

  const [{ data: characterRows }, { data: itemRows }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, strength, platinum, gold, silver, copper, image_path")
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
    imageUrl: c.image_path
      ? supabase.storage.from("public-assets").getPublicUrl(c.image_path).data
          .publicUrl
      : null,
    items: itemsByCharacter.get(c.id) ?? [],
  }));
}

/**
 * The change log is fetched separately, and only while the log panel is open —
 * it carries up to 100 rows with JSON snapshots, which is not worth re-reading
 * after every item edit.
 */
export async function fetchInventoryLogClient(
  campaignId: string,
  limit = 100
): Promise<InventoryLogEntry[]> {
  const supabase = createClient();
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
