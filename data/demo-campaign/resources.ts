import type { ResourcesDashboard } from "@/lib/resources/types";

export const DEMO_RESOURCES: ResourcesDashboard = {
  cards: [
    {
      id: "demo-card-mara",
      name: "Mara",
      characterId: "demo-char-mara",
      items: [
        { id: "demo-res-mara-1", name: "Second Wind", currentValue: 1, totalValue: 1, sortOrder: 0 },
        { id: "demo-res-mara-2", name: "Action Surge", currentValue: 1, totalValue: 1, sortOrder: 1 },
        { id: "demo-res-mara-3", name: "Superiority Dice", currentValue: 3, totalValue: 4, sortOrder: 2 },
      ],
    },
    {
      id: "demo-card-dex",
      name: "Dex",
      characterId: "demo-char-dex",
      items: [
        { id: "demo-res-dex-1", name: "Sneak Attack", currentValue: 1, totalValue: 1, sortOrder: 0 },
        { id: "demo-res-dex-2", name: "Cunning Action", currentValue: 1, totalValue: 1, sortOrder: 1 },
        { id: "demo-res-dex-3", name: "Poison Vials", currentValue: 2, totalValue: 3, sortOrder: 2 },
      ],
    },
    {
      id: "demo-card-wren-slots",
      name: "Wren",
      characterId: "demo-char-wren",
      items: [
        { id: "demo-res-1", name: "1st-level spell slots", currentValue: 2, totalValue: 4, sortOrder: 0 },
        { id: "demo-res-2", name: "2nd-level spell slots", currentValue: 2, totalValue: 3, sortOrder: 1 },
        { id: "demo-res-wren-3", name: "3rd-level spell slots", currentValue: 1, totalValue: 2, sortOrder: 2 },
        { id: "demo-res-wren-4", name: "Arcane Recovery", currentValue: 1, totalValue: 1, sortOrder: 3 },
      ],
    },
    {
      id: "demo-card-tobi-channel",
      name: "Tobi",
      characterId: "demo-char-tobi",
      items: [
        { id: "demo-res-3", name: "Channel Divinity", currentValue: 1, totalValue: 2, sortOrder: 0 },
        { id: "demo-res-tobi-2", name: "Divine Sense", currentValue: 2, totalValue: 3, sortOrder: 1 },
        { id: "demo-res-tobi-3", name: "Healing Word", currentValue: 3, totalValue: 4, sortOrder: 2 },
      ],
    },
  ],
  layouts: {
    lg: [
      { i: "demo-card-mara", x: 0, y: 0, w: 3, h: 4 },
      { i: "demo-card-dex", x: 3, y: 0, w: 3, h: 4 },
      { i: "demo-card-wren-slots", x: 0, y: 4, w: 3, h: 5 },
      { i: "demo-card-tobi-channel", x: 3, y: 4, w: 3, h: 4 },
    ],
    md: [
      { i: "demo-card-mara", x: 0, y: 0, w: 2, h: 4 },
      { i: "demo-card-dex", x: 2, y: 0, w: 2, h: 4 },
      { i: "demo-card-wren-slots", x: 0, y: 4, w: 2, h: 5 },
      { i: "demo-card-tobi-channel", x: 2, y: 4, w: 2, h: 4 },
    ],
    sm: [
      { i: "demo-card-mara", x: 0, y: 0, w: 1, h: 4 },
      { i: "demo-card-dex", x: 1, y: 0, w: 1, h: 4 },
      { i: "demo-card-wren-slots", x: 0, y: 4, w: 1, h: 5 },
      { i: "demo-card-tobi-channel", x: 1, y: 4, w: 1, h: 4 },
    ],
    xs: [
      { i: "demo-card-mara", x: 0, y: 0, w: 1, h: 4 },
      { i: "demo-card-dex", x: 0, y: 4, w: 1, h: 4 },
      { i: "demo-card-wren-slots", x: 0, y: 8, w: 1, h: 5 },
      { i: "demo-card-tobi-channel", x: 0, y: 13, w: 1, h: 4 },
    ],
    xxs: [
      { i: "demo-card-mara", x: 0, y: 0, w: 1, h: 4 },
      { i: "demo-card-dex", x: 0, y: 4, w: 1, h: 4 },
      { i: "demo-card-wren-slots", x: 0, y: 8, w: 1, h: 5 },
      { i: "demo-card-tobi-channel", x: 0, y: 13, w: 1, h: 4 },
    ],
  },
};
