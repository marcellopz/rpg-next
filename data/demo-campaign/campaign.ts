import type { Campaign } from "@/components/campaigns/CampaignCard";
import type { CampaignDetail } from "@/lib/queries/campaigns";
import { DEMO_CAMPAIGN_CODE } from "./constants";

const DEMO_NAME = "Shadows of Eldermoor";
const DEMO_DESCRIPTION =
  "A creeping blight swallows the northern holds. The party hunts its source through ruined keeps and older, hungrier things.";

export const DEMO_CAMPAIGN_DETAIL: CampaignDetail = {
  id: DEMO_CAMPAIGN_CODE,
  publicCode: DEMO_CAMPAIGN_CODE,
  name: DEMO_NAME,
  description: DEMO_DESCRIPTION,
  role: null,
  isAdmin: false,
  isDm: false,
  imageUrl: null,
};

// Card summary shown on /campaigns — links to /campaigns/{DEMO_CAMPAIGN_CODE}.
export const DEMO_CAMPAIGN_CARD: Campaign = {
  id: DEMO_CAMPAIGN_CODE,
  name: DEMO_NAME,
  description: DEMO_DESCRIPTION,
  members: ["Mara", "Dex", "Wren", "Tobi"],
  demo: true,
};
