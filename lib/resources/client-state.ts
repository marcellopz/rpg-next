import { createClient } from "@/lib/supabase/client";
import {
  EMPTY_LAYOUTS,
  type DashboardLayouts,
  type ResourceCard,
  type ResourceItem,
  type ResourcesDashboard,
} from "@/lib/resources/types";

// Browser-side re-read of the resources dashboard, mirroring
// getResourcesForCampaign in lib/queries/resources.ts. Used to reconcile after
// an optimistic mutation and to pick up other members' changes over realtime.
// One targeted query set instead of router.refresh(), which would re-render the
// whole workspace (campaign detail + membership + active tool + combat).

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

export async function fetchResourcesClient(
  campaignId: string
): Promise<ResourcesDashboard> {
  const supabase = createClient();

  const [{ data: cardRows }, { data: itemRows }, { data: layoutRow }] =
    await Promise.all([
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

  return {
    cards,
    layouts: (layoutRow?.layouts as DashboardLayouts | undefined) ?? EMPTY_LAYOUTS,
  };
}
