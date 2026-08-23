import type { CampaignMap, LinkedNote, LinkedPin, MapPin } from "@/lib/map/types";
import { DEMO_CAMPAIGN_CODE } from "./constants";

const DEMO_DM_ID = "demo-dm";
const DEMO_MAP_ID = "demo-map-1";
const DEMO_CREATED_AT = "2026-01-02T10:00:00.000Z";

function pin(
  id: string,
  x: number,
  y: number,
  label: string,
  type: MapPin["type"],
  description: string
): MapPin {
  return {
    id,
    mapId: DEMO_MAP_ID,
    x,
    y,
    label,
    description,
    type,
    createdBy: DEMO_DM_ID,
    createdAt: DEMO_CREATED_AT,
  };
}

export const DEMO_MAP_PINS: MapPin[] = [
  pin(
    "demo-pin-eldermoor",
    0.48,
    0.43,
    "Eldermoor",
    "settlement",
    "Seat of the Eldermoor Council. The party returns here between forays into the blighted north."
  ),
  pin(
    "demo-pin-fenwood",
    0.5,
    0.3,
    "Fenwood Shrine",
    "dungeon",
    "An abandoned shrine at the heart of the rotting wood. The ledger that named the blight was found here."
  ),
  pin(
    "demo-pin-blightfall",
    0.49,
    0.56,
    "Blightfall Keep",
    "danger",
    "Ruined keep on the Mistmere shore. Something dragged the shrine's reliquary here to accelerate the binding's failure."
  ),
  pin(
    "demo-pin-holds",
    0.47,
    0.18,
    "Northern Holds",
    "location",
    "Three highland farms already half-swallowed by the grey rot."
  ),
  pin(
    "demo-pin-camp",
    0.49,
    0.36,
    "Party camp",
    "quest",
    "Last safe clearing on the road between Eldermoor and the Fenwood."
  ),
  pin(
    "demo-pin-wardens",
    0.62,
    0.35,
    "Warden's Circle ruins",
    "group",
    "Scattered stones that once marked the original binding site. Numbered for the party's search order."
  ),
];

/** pinId → linked demo note pages (popover + note editor deep links). */
export const DEMO_PIN_PAGE_LINKS: Record<string, LinkedNote[]> = {
  "demo-pin-eldermoor": [
    { pageId: "demo-page-overview", title: "Campaign Overview", visibility: "public" },
    { pageId: "demo-page-roster", title: "Party Roster", visibility: "public" },
  ],
  "demo-pin-fenwood": [
    { pageId: "demo-page-blight", title: "The Blight", visibility: "public" },
    {
      pageId: "demo-page-session5",
      title: "Session 5 — What the Ledger Said",
      visibility: "public",
    },
  ],
  "demo-pin-blightfall": [
    {
      pageId: "demo-page-session2",
      title: "Session 2 — Blightfall Keep",
      visibility: "public",
    },
    {
      pageId: "demo-page-session4",
      title: "Session 4 — Down the Spiral",
      visibility: "public",
    },
  ],
  "demo-pin-holds": [
    { pageId: "demo-page-blight", title: "The Blight", visibility: "public" },
  ],
  "demo-pin-camp": [
    {
      pageId: "demo-page-session1",
      title: "Session 1 — Into the Mire",
      visibility: "public",
    },
  ],
  "demo-pin-wardens": [
    {
      pageId: "demo-page-session5",
      title: "Session 5 — What the Ledger Said",
      visibility: "public",
    },
  ],
};

export const DEMO_MAP: CampaignMap = {
  id: DEMO_MAP_ID,
  campaignId: DEMO_CAMPAIGN_CODE,
  imagePath: "external/sword-coast-map.jpg",
  // Hosted by Wizards — not copied into this repo.
  imageUrl:
    "https://media.wizards.com/2015/images/dnd/resources/Sword-Coast-Map_LowRes.jpg",
  updatedAt: DEMO_CREATED_AT,
  pins: DEMO_MAP_PINS,
};

export const DEMO_MAP_HISTORY: Array<{
  id: string;
  action: "add" | "edit" | "move" | "delete";
  pinLabel: string;
  actorName: string;
  createdAt: string;
}> = [
  {
    id: "demo-map-log-1",
    action: "add",
    pinLabel: "Eldermoor",
    actorName: "DM",
    createdAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "demo-map-log-2",
    action: "add",
    pinLabel: "Fenwood Shrine",
    actorName: "DM",
    createdAt: "2026-01-02T10:05:00.000Z",
  },
  {
    id: "demo-map-log-3",
    action: "add",
    pinLabel: "Blightfall Keep",
    actorName: "DM",
    createdAt: "2026-01-03T18:20:00.000Z",
  },
  {
    id: "demo-map-log-4",
    action: "edit",
    pinLabel: "Party camp",
    actorName: "DM",
    createdAt: "2026-01-04T21:00:00.000Z",
  },
];

export function isDemoMapId(mapId: string | null | undefined): boolean {
  return mapId === DEMO_MAP_ID;
}

export function isDemoPinId(pinId: string | null | undefined): boolean {
  return Boolean(pinId?.startsWith("demo-pin-"));
}

export function isDemoPageId(pageId: string | null | undefined): boolean {
  return Boolean(pageId?.startsWith("demo-page-"));
}

export function getDemoPinsLinkedToPage(pageId: string): LinkedPin[] {
  const pins: LinkedPin[] = [];
  for (const pinRow of DEMO_MAP_PINS) {
    const links = DEMO_PIN_PAGE_LINKS[pinRow.id] ?? [];
    if (links.some((n) => n.pageId === pageId)) {
      pins.push({
        pinId: pinRow.id,
        label: pinRow.label,
        type: pinRow.type,
      });
    }
  }
  return pins;
}

export function getDemoPagesLinkedToPin(pinId: string): LinkedNote[] {
  return DEMO_PIN_PAGE_LINKS[pinId] ?? [];
}
