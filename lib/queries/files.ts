import { createServerClient } from "@/lib/supabase/server";
import { mapFileRow, type FileDbRow } from "@/lib/files/mappers";
import type {
  HandoutBroadcast,
  StorageBucket,
} from "@/lib/files/types";

function serverPublicUrl(bucket: StorageBucket, path: string): string | null {
  if (bucket !== "public-assets") return null;
  const supabase = createServerClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function getFilesForCampaign(campaignId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("files")
    .select(
      "id, campaign_id, uploader_id, bucket, path, filename, content_type, size_bytes, visibility, created_at"
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as FileDbRow[]).map((row) =>
    mapFileRow(row, serverPublicUrl)
  );
}

export async function getHandoutBroadcast(
  campaignId: string
): Promise<HandoutBroadcast | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("campaign_handout_broadcasts")
    .select(
      `
      campaign_id,
      file_id,
      shown_by,
      updated_at,
      file:files (
        id, campaign_id, uploader_id, bucket, path, filename,
        content_type, size_bytes, visibility, created_at
      )
    `
    )
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const fileRow = Array.isArray(data.file) ? data.file[0] : data.file;

  return {
    campaignId: data.campaign_id,
    fileId: data.file_id,
    shownBy: data.shown_by,
    updatedAt: data.updated_at,
    file: fileRow
      ? mapFileRow(fileRow as FileDbRow, serverPublicUrl)
      : null,
  };
}
