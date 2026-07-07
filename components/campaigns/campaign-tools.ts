export type CampaignToolId =
  | "notes"
  | "inventory"
  | "map"
  | "handouts"
  | "resources";

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
    id: "inventory",
    label: "Inventory",
    hint: "Track each party member's gear, coins, and carry weight.",
    placeholder: "",
  },
  {
    id: "resources",
    label: "Resources",
    hint: "Keep track of resources like spell slots, character abilities, and other resources.",
    placeholder:
      "A resource tracker for spell slots, character abilities, and other resources.",
  },
  {
    id: "map",
    label: "World map",
    hint: "Upload a world map for the table.",
    placeholder: "A world map for the table.",
  },
  {
    id: "handouts",
    label: "Handouts & files",
    hint: "Upload maps, images, and PDFs for the table.",
    placeholder:
      "A file library for campaign assets — maps, player handouts, and reference PDFs — with optional TV broadcast.",
  },
];

export const CAMPAIGN_TOOL_TABS = CAMPAIGN_TOOLS;

const TOOL_IDS = new Set(CAMPAIGN_TOOLS.map((t) => t.id));

export function parseCampaignTool(value: string | undefined): CampaignToolId {
  if (value && TOOL_IDS.has(value as CampaignToolId))
    return value as CampaignToolId;
  return "notes";
}
