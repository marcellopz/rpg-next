import { createServerClient } from "@/lib/supabase/server";
import {
  EMPTY_LAYOUTS,
  type DashboardLayouts,
  type InventoryCharacterOption,
  type ResourceCard,
  type ResourceItem,
  type ResourcesDashboard,
} from "@/lib/resources/types";

export type {
  InventoryCharacterOption,
  ResourceCard,
  ResourceItem,
  ResourcesDashboard,
} from "@/lib/resources/types";
export { EMPTY_LAYOUTS } from "@/lib/resources/types";

type CardRow = {
  id: string;
  name: string;
  character_id: string | null;
};

type ItemRow = {
  id: string;
  card_id: string;
  name: string;
  current_value: number;
  total_value: number;
  sort_order: number;
};

export async function getResourcesForCampaign(
  campaignId: string
): Promise<ResourcesDashboard> {
  const supabase = createServerClient();

  const [
    { data: cardRows },
    { data: itemRows },
    { data: layoutRow },
  ] = await Promise.all([
    supabase
      .from("resource_cards")
      .select("id, name, character_id")
      .eq("campaign_id", campaignId)
      .order("created_at")
      .returns<CardRow[]>(),
    supabase
      .from("resource_items")
      .select("id, card_id, name, current_value, total_value, sort_order")
      .eq("campaign_id", campaignId)
      .order("sort_order")
      .order("created_at")
      .returns<ItemRow[]>(),
    supabase
      .from("resource_dashboard_layouts")
      .select("layouts")
      .eq("campaign_id", campaignId)
      .maybeSingle(),
  ]);

  const itemsByCard = new Map<string, ResourceItem[]>();
  for (const row of itemRows ?? []) {
    const list = itemsByCard.get(row.card_id) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      currentValue: row.current_value,
      totalValue: row.total_value,
      sortOrder: row.sort_order,
    });
    itemsByCard.set(row.card_id, list);
  }

  const cards: ResourceCard[] = (cardRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    characterId: row.character_id,
    items: itemsByCard.get(row.id) ?? [],
  }));

  const layouts =
    (layoutRow?.layouts as DashboardLayouts | undefined) ?? EMPTY_LAYOUTS;

  return { cards, layouts };
}

export async function getInventoryCharacterOptions(
  campaignId: string
): Promise<InventoryCharacterOption[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("characters")
    .select("id, name")
    .eq("campaign_id", campaignId)
    .order("sort_order")
    .order("created_at");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));
}
