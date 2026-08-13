import { createClient } from "@/lib/supabase/client";
import { mapPinRow, type CampaignMap, type MapPinDbRow } from "@/lib/map/types";

/** RLS-scoped read of the campaign's map + pins. Null when no map exists yet. */
export async function fetchMapForCampaignClient(
  campaignId: string
): Promise<CampaignMap | null> {
  const supabase = createClient();

  const { data: map, error } = await supabase
    .from("campaign_maps")
    .select("id, campaign_id, image_path, updated_at")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!map) return null;

  const { data: pins, error: pinsError } = await supabase
    .from("map_pins")
    .select("id, map_id, x, y, label, description, type, created_by, created_at")
    .eq("map_id", map.id)
    .order("created_at", { ascending: true });
  if (pinsError) throw new Error(pinsError.message);

  const { data: urlData } = supabase.storage
    .from("public-assets")
    .getPublicUrl(map.image_path);

  return {
    id: map.id,
    campaignId: map.campaign_id,
    imagePath: map.image_path,
    imageUrl: urlData.publicUrl,
    updatedAt: map.updated_at,
    pins: ((pins ?? []) as MapPinDbRow[]).map(mapPinRow),
  };
}
