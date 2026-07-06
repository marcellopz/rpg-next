import type { Layouts } from "react-grid-layout";

export type DashboardLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Serializable grid layouts shared by client and server code. */
export type DashboardLayouts = {
  lg?: DashboardLayoutItem[];
  md?: DashboardLayoutItem[];
  sm?: DashboardLayoutItem[];
  xs?: DashboardLayoutItem[];
  xxs?: DashboardLayoutItem[];
};

export type ResourceItem = {
  id: string;
  name: string;
  currentValue: number;
  totalValue: number;
  sortOrder: number;
};

export type ResourceCard = {
  id: string;
  name: string;
  characterId: string | null;
  items: ResourceItem[];
};

export type InventoryCharacterOption = {
  id: string;
  name: string;
};

export type ResourcesDashboard = {
  cards: ResourceCard[];
  layouts: DashboardLayouts;
};

export const EMPTY_LAYOUTS: DashboardLayouts = {
  lg: [],
  md: [],
  sm: [],
  xs: [],
  xxs: [],
};

/** Cast stored layouts to react-grid-layout's type at the grid boundary. */
export function asGridLayouts(layouts: DashboardLayouts): Layouts {
  return layouts as Layouts;
}
