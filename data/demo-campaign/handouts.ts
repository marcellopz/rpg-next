import type { CampaignFileRow } from "@/lib/files/types";
import { DEMO_CAMPAIGN_CODE } from "./constants";

const DEMO_UPLOADER_ID = "demo-dm";

export const DEMO_HANDOUTS: CampaignFileRow[] = [
  {
    id: "demo-file-1",
    campaignId: DEMO_CAMPAIGN_CODE,
    uploaderId: DEMO_UPLOADER_ID,
    bucket: "public-assets",
    path: "demo/eldermoor-map.svg",
    filename: "Eldermoor region map.svg",
    contentType: "image/svg+xml",
    sizeBytes: null,
    visibility: "public",
    createdAt: "2026-01-01T08:00:00.000Z",
    publicUrl: "/home/screenshot-combat.svg",
  },
  {
    id: "demo-file-2",
    campaignId: DEMO_CAMPAIGN_CODE,
    uploaderId: DEMO_UPLOADER_ID,
    bucket: "public-assets",
    path: "demo/blightfall-keep.svg",
    filename: "Blightfall Keep layout.svg",
    contentType: "image/svg+xml",
    sizeBytes: null,
    visibility: "public",
    createdAt: "2026-01-01T08:05:00.000Z",
    publicUrl: "/home/screenshot-inventory.svg",
  },
];
