export type StorageBucket = "public-assets" | "private-files";

export type HandoutVisibility = "public" | "private";

export type CampaignFileRow = {
  id: string;
  campaignId: string;
  uploaderId: string;
  bucket: StorageBucket;
  path: string;
  filename: string;
  contentType: string | null;
  sizeBytes: number | null;
  visibility: HandoutVisibility;
  createdAt: string;
  publicUrl: string | null;
};

/** @deprecated Prefer CampaignFileRow — kept as alias for existing handout UI. */
export type HandoutFile = CampaignFileRow;

export type HandoutBroadcast = {
  campaignId: string;
  fileId: string | null;
  shownBy: string | null;
  updatedAt: string;
  file: CampaignFileRow | null;
};

export function bucketForVisibility(
  visibility: HandoutVisibility
): StorageBucket {
  return visibility === "public" ? "public-assets" : "private-files";
}

export function visibilityForBucket(bucket: StorageBucket): HandoutVisibility {
  return bucket === "public-assets" ? "public" : "private";
}

export function handoutsFolder(campaignId: string): string {
  return `${campaignId}/handouts`;
}

export function displayNameFromObjectName(objectName: string): string {
  return objectName.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-/i,
    ""
  );
}

export function isImageContentType(
  contentType: string | null | undefined
): boolean {
  return Boolean(contentType?.startsWith("image/"));
}

export function isPdfContentType(
  contentType: string | null | undefined
): boolean {
  return contentType === "application/pdf";
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function publicUrlForFile(
  bucket: StorageBucket,
  path: string,
  getPublicUrl: (path: string) => string
): string | null {
  if (bucket !== "public-assets") return null;
  return getPublicUrl(path);
}
