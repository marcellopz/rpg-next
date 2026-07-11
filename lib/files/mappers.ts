import type {
  CampaignFileRow,
  StorageBucket,
} from "@/lib/files/types";

export type FileDbRow = {
  id: string;
  campaign_id: string;
  uploader_id: string;
  bucket: StorageBucket;
  path: string;
  filename: string;
  content_type: string | null;
  size_bytes: number | null;
  visibility: "public" | "private";
  created_at: string;
};

export function mapFileRow(
  row: FileDbRow,
  getPublicUrl: (bucket: StorageBucket, path: string) => string | null
): CampaignFileRow {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    uploaderId: row.uploader_id,
    bucket: row.bucket,
    path: row.path,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    visibility: row.visibility,
    createdAt: row.created_at,
    publicUrl: getPublicUrl(row.bucket, row.path),
  };
}
