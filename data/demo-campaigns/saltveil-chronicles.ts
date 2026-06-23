import type { Campaign } from "@/components/campaigns/CampaignCard";

export const saltveilChronicles: Campaign = {
  id: "saltveil-chronicles",
  name: "The Saltveil Chronicles",
  description:
    "Pirate-archaeologists race rival fleets to a drowned city, where every reef hides a curse and a fortune.",
  members: ["captain@table.rpg", "rook@table.rpg", "isla@table.rpg"],
  memberLabels: {
    "captain@table.rpg": "Captain",
    "rook@table.rpg": "Rook",
    "isla@table.rpg": "Isla",
  },
  demo: true,
};
