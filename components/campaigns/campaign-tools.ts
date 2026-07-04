export type CampaignToolId =
  | "notes"
  | "combat"
  | "inventory"
  | "handouts";

export const CAMPAIGN_TOOLS: {
  id: CampaignToolId;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    id: "notes",
    label: "Notes",
    hint: "The tree below is your notes navigator — pick a page to edit it on the right.",
    placeholder: "",
  },
  {
    id: "combat",
    label: "Combat tracker",
    hint: "Track initiative, hit points, and conditions during encounters.",
    placeholder:
      "A live combat log with turn order, HP tracking, and condition chips will live here — synced to the TV display during sessions.",
  },
  {
    id: "inventory",
    label: "Inventory log",
    hint: "Record loot, consumables, and party gear changes over time.",
    placeholder:
      "Session-by-session inventory entries with who picked up what, quantities, and where items ended up.",
  },
  {
    id: "handouts",
    label: "Handouts & files",
    hint: "Upload maps, images, and PDFs for the table.",
    placeholder:
      "A file library for campaign assets — maps, player handouts, and reference PDFs — with optional TV broadcast.",
  },
];

export const CAMPAIGN_TOOL_TABS = CAMPAIGN_TOOLS.filter(
  (tool) => tool.id !== "combat"
);

const TOOL_IDS = new Set(CAMPAIGN_TOOLS.map((t) => t.id));

export function parseCampaignTool(value: string | undefined): CampaignToolId {
  if (value && TOOL_IDS.has(value as CampaignToolId))
    return value as CampaignToolId;
  return "notes";
}
