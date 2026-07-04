/** Inventory item types and their display config (labels + text colors). */
export const INVENTORY_ITEM_TYPES = [
  "normal",
  "magic",
  "consumable",
  "other",
] as const;

export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

export type InventoryItemTypeConfig = {
  label: string;
  /** Tailwind classes applied to the item name and type columns. */
  textClassName: string;
};

export const INVENTORY_ITEM_TYPE_CONFIG: Record<
  InventoryItemType,
  InventoryItemTypeConfig
> = {
  normal: { label: "Normal", textClassName: "text-gray-600" },
  magic: { label: "Magic", textClassName: "font-semibold text-violet-600" },
  consumable: {
    label: "Consumable",
    textClassName: "font-semibold text-amber-700",
  },
  other: { label: "Other", textClassName: "font-semibold text-sky-700" },
};

export const INVENTORY_ITEM_TYPE_LIST = INVENTORY_ITEM_TYPES.map((id) => ({
  id,
  ...INVENTORY_ITEM_TYPE_CONFIG[id],
}));

export function isInventoryItemType(value: string): value is InventoryItemType {
  return (INVENTORY_ITEM_TYPES as readonly string[]).includes(value);
}

export function itemTypeTextClass(type: InventoryItemType): string {
  return INVENTORY_ITEM_TYPE_CONFIG[type].textClassName;
}
