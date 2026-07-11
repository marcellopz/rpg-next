import { createClient } from "@/lib/supabase/client";
import { mapFileRow, type FileDbRow } from "@/lib/files/mappers";
import type {
  CampaignFileRow,
  HandoutBroadcast,
  StorageBucket,
} from "@/lib/files/types";

function browserPublicUrl(bucket: StorageBucket, path: string): string | null {
  if (bucket !== "public-assets") return null;
  const supabase = createClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function fetchFilesForCampaignClient(
  campaignId: string
): Promise<CampaignFileRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("files")
    .select(
      "id, campaign_id, uploader_id, bucket, path, filename, content_type, size_bytes, visibility, created_at"
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as FileDbRow[]).map((row) =>
    mapFileRow(row, browserPublicUrl)
  );
}

export async function fetchHandoutBroadcastClient(
  campaignId: string
): Promise<HandoutBroadcast | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaign_handout_broadcasts")
    .select("campaign_id, file_id, shown_by, updated_at")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  if (!data.file_id) {
    return {
      campaignId: data.campaign_id,
      fileId: null,
      shownBy: data.shown_by,
      updatedAt: data.updated_at,
      file: null,
    };
  }

  const { data: file, error: fileError } = await supabase
    .from("files")
    .select(
      "id, campaign_id, uploader_id, bucket, path, filename, content_type, size_bytes, visibility, created_at"
    )
    .eq("id", data.file_id)
    .maybeSingle();

  if (fileError) throw new Error(fileError.message);

  return {
    campaignId: data.campaign_id,
    fileId: data.file_id,
    shownBy: data.shown_by,
    updatedAt: data.updated_at,
    file: file ? mapFileRow(file as FileDbRow, browserPublicUrl) : null,
  };
}
