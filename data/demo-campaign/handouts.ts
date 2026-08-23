import type { CampaignFileRow } from "@/lib/files/types";
import { DEMO_CAMPAIGN_CODE } from "./constants";

const DEMO_UPLOADER_ID = "demo-dm";
const SWORD_COAST_MAP_URL =
  "https://media.wizards.com/2015/images/dnd/resources/Sword-Coast-Map_LowRes.jpg";

export const DEMO_HANDOUTS: CampaignFileRow[] = [
  {
    id: "demo-file-1",
    campaignId: DEMO_CAMPAIGN_CODE,
    uploaderId: DEMO_UPLOADER_ID,
    bucket: "public-assets",
    path: "external/sword-coast-map.jpg",
    filename: "Sword Coast map.jpg",
    contentType: "image/jpeg",
    sizeBytes: null,
    visibility: "public",
    createdAt: "2026-01-01T08:00:00.000Z",
    publicUrl: SWORD_COAST_MAP_URL,
  },
];
