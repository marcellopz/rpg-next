import type { CampaignDetail } from "@/lib/queries/campaigns";
import type { NotePage, NoteTrees } from "@/lib/queries/notes";
import type { Character, InventoryLogEntry } from "@/lib/queries/inventory";
import type { ResourcesDashboard } from "@/lib/resources/types";
import type { CombatState } from "@/lib/combat/types";
import type { CampaignFileRow } from "@/lib/files/types";

import { DEMO_CAMPAIGN_DETAIL } from "./campaign";

export { DEMO_CAMPAIGN_CARD } from "./campaign";
import { DEMO_NOTE_TREES, DEMO_PAGES } from "./notes";
import { DEMO_CHARACTERS, DEMO_INVENTORY_LOG } from "./inventory";
import { DEMO_RESOURCES } from "./resources";
import { DEMO_COMBAT } from "./combat";
import { DEMO_HANDOUTS } from "./handouts";

export { DEMO_CAMPAIGN_CODE, isDemoCampaignId } from "./constants";

export type DemoCampaignData = {
  detail: CampaignDetail;
  noteTrees: NoteTrees;
  pageById: (id: string) => NotePage | null;
  characters: Character[];
  inventoryLog: InventoryLogEntry[];
  resources: ResourcesDashboard;
  combat: CombatState;
  handouts: CampaignFileRow[];
};

// Everything app/campaigns/[campaignCode]/page.tsx needs to render the demo
// campaign without touching Supabase. Cheap to construct — call fresh per
// request rather than caching.
export function getDemoCampaign(): DemoCampaignData {
  return {
    detail: DEMO_CAMPAIGN_DETAIL,
    noteTrees: DEMO_NOTE_TREES,
    pageById: (id) => DEMO_PAGES[id] ?? null,
    characters: DEMO_CHARACTERS,
    inventoryLog: DEMO_INVENTORY_LOG,
    resources: DEMO_RESOURCES,
    combat: DEMO_COMBAT,
    handouts: DEMO_HANDOUTS,
  };
}
