import type { Campaign } from "@/components/campaigns/CampaignCard";

export const shadowsOfEldermoor: Campaign = {
  id: "shadows-of-eldermoor",
  name: "Shadows of Eldermoor",
  description:
    "A creeping blight swallows the northern holds. The party hunts its source through ruined keeps and older, hungrier things.",
  members: ["mara@table.rpg", "dex@table.rpg", "wren@table.rpg", "tobi@table.rpg"],
  memberLabels: {
    "mara@table.rpg": "Mara",
    "dex@table.rpg": "Dex",
    "wren@table.rpg": "Wren",
    "tobi@table.rpg": "Tobi",
  },
  role: "dm",
  demo: true,
};
