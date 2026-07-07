export type CombatantType = "player" | "enemy" | "ally" | "undead";

export type CombatCondition = {
  id: string;
  name: string;
  duration: number;
  color: string;
};

export type CombatCombatant = {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  combatantType: CombatantType;
  orderIndex: number;
  usedReaction: boolean;
  visible: boolean;
  nameHidden: boolean;
  alias: string | null;
  conditions: CombatCondition[];
};

export type CombatSession = {
  campaignId: string;
  active: boolean;
  round: number;
  turn: number;
  dmNotes: string;
  showHpToPlayers: boolean;
  startedBy: string | null;
  updatedAt: string;
};

export type CombatState = {
  session: CombatSession;
  combatants: CombatCombatant[];
};

export const CONDITION_COLORS = [
  { name: "gray", color: "#A9A9A9" },
  { name: "red", color: "#FF6B6B" },
  { name: "blue", color: "#4D90FE" },
  { name: "green", color: "#90EE90" },
  { name: "yellow", color: "#FFFACD" },
  { name: "orange", color: "#FFA07A" },
  { name: "purple", color: "#D8BFD8" },
  { name: "pink", color: "#FFC0CB" },
  { name: "brown", color: "#BC8F8F" },
] as const;
