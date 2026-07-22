import { EMPTY_LAYOUTS, type ResourcesDashboard } from "@/lib/resources/types";

export const DEMO_RESOURCES: ResourcesDashboard = {
  cards: [
    {
      id: "demo-card-wren-slots",
      name: "Wren — Spell Slots",
      characterId: "demo-char-wren",
      items: [
        { id: "demo-res-1", name: "1st level", currentValue: 2, totalValue: 4, sortOrder: 0 },
        { id: "demo-res-2", name: "2nd level", currentValue: 1, totalValue: 2, sortOrder: 1 },
      ],
    },
    {
      id: "demo-card-tobi-channel",
      name: "Tobi — Channel Divinity",
      characterId: "demo-char-tobi",
      items: [
        { id: "demo-res-3", name: "Uses", currentValue: 1, totalValue: 2, sortOrder: 0 },
      ],
    },
  ],
  layouts: EMPTY_LAYOUTS,
};
