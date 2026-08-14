export const MAP_PIN_TYPES = [
  "location",
  "settlement",
  "dungeon",
  "quest",
  "danger",
  "group",
] as const;

export type MapPinType = (typeof MAP_PIN_TYPES)[number];

export function parseMapPinType(value: string): MapPinType {
  return (MAP_PIN_TYPES as readonly string[]).includes(value)
    ? (value as MapPinType)
    : "location";
}

/**
 * Tailwind classes per pin type: `icon` colors the lucide MapPin glyph,
 * `dot` fills the legend swatch / form picker, `chip` styles the numbered
 * circle used by ordered 'group' pins.
 */
export const PIN_TYPE_STYLES: Record<
  MapPinType,
  { icon: string; dot: string; chip: string }
> = {
  location: {
    icon: "text-red-600",
    dot: "bg-red-600",
    chip: "bg-red-600 text-white",
  },
  settlement: {
    icon: "text-blue-600",
    dot: "bg-blue-600",
    chip: "bg-blue-600 text-white",
  },
  dungeon: {
    icon: "text-stone-600",
    dot: "bg-stone-600",
    chip: "bg-stone-600 text-white",
  },
  quest: {
    icon: "text-amber-500",
    dot: "bg-amber-500",
    chip: "bg-amber-500 text-white",
  },
  danger: {
    icon: "text-orange-600",
    dot: "bg-orange-600",
    chip: "bg-orange-600 text-white",
  },
  group: {
    icon: "text-emerald-600",
    dot: "bg-emerald-600",
    chip: "bg-emerald-600 text-white",
  },
};

export type MapPin = {
  id: string;
  mapId: string;
  /** Fraction (0..1) of the image's natural width. */
  x: number;
  /** Fraction (0..1) of the image's natural height. */
  y: number;
  label: string;
  description: string | null;
  type: MapPinType;
  createdBy: string;
  createdAt: string;
};

export type CampaignMap = {
  id: string;
  campaignId: string;
  imagePath: string;
  imageUrl: string;
  updatedAt: string;
  pins: MapPin[];
};

export type MapPinLogAction = "add" | "edit" | "move" | "delete";

/** A note page linked to a pin, as shown in the pin's popover. */
export type LinkedNote = {
  pageId: string;
  title: string;
  visibility: "public" | "private";
};

/** A map pin linked to a note page, as shown in the note editor. */
export type LinkedPin = {
  pinId: string;
  label: string;
  type: MapPinType;
};

export function mapsFolder(campaignId: string): string {
  return `${campaignId}/map`;
}

export type MapPinDbRow = {
  id: string;
  map_id: string;
  x: number | string;
  y: number | string;
  label: string;
  description: string | null;
  type: string;
  created_by: string;
  created_at: string;
};

// Postgres `numeric` can arrive as a string depending on the driver, so the
// coordinates always go through Number().
export function mapPinRow(row: MapPinDbRow): MapPin {
  return {
    id: row.id,
    mapId: row.map_id,
    x: Number(row.x),
    y: Number(row.y),
    label: row.label,
    description: row.description,
    type: parseMapPinType(row.type),
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
