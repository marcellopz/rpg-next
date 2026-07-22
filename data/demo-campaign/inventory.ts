import type { Character, InventoryItem, InventoryLogEntry } from "@/lib/queries/inventory";

function item(
  characterId: string,
  id: string,
  name: string,
  itemType: InventoryItem["itemType"],
  weight: number,
  quantity: number
): InventoryItem {
  return { id, characterId, name, itemType, weight, quantity };
}

const mara: Character = {
  id: "demo-char-mara",
  name: "Mara",
  strength: 16,
  platinum: 0,
  gold: 42,
  silver: 15,
  copper: 8,
  imageUrl: null,
  items: [
    item("demo-char-mara", "demo-item-1", "Longsword", "normal", 3, 1),
    item("demo-char-mara", "demo-item-2", "Chain mail", "normal", 55, 1),
    item("demo-char-mara", "demo-item-3", "Holy symbol of the Council", "magic", 0.5, 1),
    item("demo-char-mara", "demo-item-4", "Healing potion", "consumable", 0.5, 2),
  ],
};

const dex: Character = {
  id: "demo-char-dex",
  name: "Dex",
  strength: 10,
  platinum: 0,
  gold: 18,
  silver: 30,
  copper: 12,
  imageUrl: null,
  items: [
    item("demo-char-dex", "demo-item-5", "Shortbow", "normal", 2, 1),
    item("demo-char-dex", "demo-item-6", "Thieves' tools", "normal", 1, 1),
    item("demo-char-dex", "demo-item-7", "Blightglass vial", "magic", 0.2, 1),
    item("demo-char-dex", "demo-item-8", "Rations", "consumable", 2, 5),
  ],
};

const wren: Character = {
  id: "demo-char-wren",
  name: "Wren",
  strength: 8,
  platinum: 1,
  gold: 60,
  silver: 5,
  copper: 0,
  imageUrl: null,
  items: [
    item("demo-char-wren", "demo-item-9", "Oak wand", "magic", 1, 1),
    item("demo-char-wren", "demo-item-10", "Spellbook", "normal", 3, 1),
    item("demo-char-wren", "demo-item-11", "Component pouch", "other", 2, 1),
  ],
};

const tobi: Character = {
  id: "demo-char-tobi",
  name: "Tobi",
  strength: 14,
  platinum: 0,
  gold: 25,
  silver: 40,
  copper: 20,
  imageUrl: null,
  items: [
    item("demo-char-tobi", "demo-item-12", "Warhammer", "normal", 5, 1),
    item("demo-char-tobi", "demo-item-13", "Shield", "normal", 6, 1),
    item("demo-char-tobi", "demo-item-14", "Prayer beads", "other", 0.2, 1),
    item("demo-char-tobi", "demo-item-15", "Healing potion", "consumable", 0.5, 3),
  ],
};

export const DEMO_CHARACTERS: Character[] = [mara, dex, wren, tobi];

export const DEMO_INVENTORY_LOG: InventoryLogEntry[] = [
  {
    id: "demo-log-1",
    actorName: "Mara",
    changeType: "add",
    description: "Mara added Healing potion x2",
    itemSnapshot: null,
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "demo-log-2",
    actorName: "Dex",
    changeType: "add",
    description: "Dex added Blightglass vial",
    itemSnapshot: null,
    createdAt: "2026-01-01T09:05:00.000Z",
  },
  {
    id: "demo-log-3",
    actorName: "Wren",
    changeType: "edit",
    description: "Wren updated Spellbook",
    itemSnapshot: null,
    createdAt: "2026-01-01T09:10:00.000Z",
  },
];
