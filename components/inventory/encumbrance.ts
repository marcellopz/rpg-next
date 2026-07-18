// Carry-weight math (parity with the old rpg-manager app): every coin weighs
// 0.02 lb and encumbrance bands are derived from strength.
import type { Character } from "@/lib/queries/inventory";

export const COIN_WEIGHT = 0.02;

export function carryWeight(character: Character): number {
  const coins =
    character.platinum + character.gold + character.silver + character.copper;
  const items = character.items.reduce(
    (sum, item) => sum + item.weight * item.quantity,
    0
  );
  return coins * COIN_WEIGHT + items;
}

export type EncumbranceZone = {
  label: string;
  startMult: number;
  endMult: number;
  chipClassName: string;
  trackClassName: string;
  fillClassName: string;
};

/** Fixed zones on the bar — each always keeps its own color. */
// Default zones with English labels (for backward compatibility)
const DEFAULT_ENCUMBRANCE_ZONES: EncumbranceZone[] = [
  {
    label: "Unencumbered",
    startMult: 0,
    endMult: 5,
    chipClassName: "bg-green-100 text-green-700",
    trackClassName: "bg-green-200",
    fillClassName: "bg-green-600",
  },
  {
    label: "Lightly encumbered",
    startMult: 5,
    endMult: 10,
    chipClassName: "bg-yellow-100 text-yellow-700",
    trackClassName: "bg-yellow-200",
    fillClassName: "bg-yellow-600",
  },
  {
    label: "Heavily encumbered",
    startMult: 10,
    endMult: 15,
    chipClassName: "bg-orange-100 text-orange-700",
    trackClassName: "bg-orange-200",
    fillClassName: "bg-orange-600",
  },
  {
    label: "Near max capacity",
    startMult: 15,
    endMult: 30,
    chipClassName: "bg-red-100 text-red-700",
    trackClassName: "bg-red-200",
    fillClassName: "bg-red-600",
  },
];

export const ENCUMBRANCE_ZONES: EncumbranceZone[] = DEFAULT_ENCUMBRANCE_ZONES;

// Create zones with translated labels
export function getEncumbranceZones(t: (key: string) => string): EncumbranceZone[] {
  return [
    {
      label: t("encumbrance.unencumbered"),
      startMult: 0,
      endMult: 5,
      chipClassName: "bg-green-100 text-green-700",
      trackClassName: "bg-green-200",
      fillClassName: "bg-green-600",
    },
    {
      label: t("encumbrance.lightly"),
      startMult: 5,
      endMult: 10,
      chipClassName: "bg-yellow-100 text-yellow-700",
      trackClassName: "bg-yellow-200",
      fillClassName: "bg-yellow-600",
    },
    {
      label: t("encumbrance.heavily"),
      startMult: 10,
      endMult: 15,
      chipClassName: "bg-orange-100 text-orange-700",
      trackClassName: "bg-orange-200",
      fillClassName: "bg-orange-600",
    },
    {
      label: t("encumbrance.overCapacity"),
      startMult: 15,
      endMult: 30,
      chipClassName: "bg-red-100 text-red-700",
      trackClassName: "bg-red-200",
      fillClassName: "bg-red-600",
    },
  ];
}

export type EncumbranceZoneSegment = {
  trackClassName: string;
  fillClassName: string;
  /** Zone width as a % of the full bar. */
  widthPercent: number;
  /** Filled portion of this zone as a % of the zone (0–100). */
  fillRatio: number;
};

export function encumbranceZoneSegments(
  strength: number,
  weight: number
): EncumbranceZoneSegment[] {
  const max = maxCarryWeight(strength);
  if (max <= 0) {
    return ENCUMBRANCE_ZONES.map((zone) => ({
      trackClassName: zone.trackClassName,
      fillClassName: zone.fillClassName,
      widthPercent: 0,
      fillRatio: 0,
    }));
  }

  return ENCUMBRANCE_ZONES.map((zone) => {
    const zoneStart = strength * zone.startMult;
    const zoneEnd = strength * zone.endMult;
    const zoneSize = zoneEnd - zoneStart;
    const widthPercent = (zoneSize / max) * 100;
    const filled = Math.max(0, Math.min(weight, zoneEnd) - zoneStart);
    const fillRatio = zoneSize > 0 ? (filled / zoneSize) * 100 : 0;

    return {
      trackClassName: zone.trackClassName,
      fillClassName: zone.fillClassName,
      widthPercent,
      fillRatio,
    };
  });
}

export function encumbranceZoneSegmentsI18n(
  strength: number,
  weight: number,
  zones: EncumbranceZone[]
): EncumbranceZoneSegment[] {
  const max = maxCarryWeight(strength);
  if (max <= 0) {
    return zones.map((zone) => ({
      trackClassName: zone.trackClassName,
      fillClassName: zone.fillClassName,
      widthPercent: 0,
      fillRatio: 0,
    }));
  }

  return zones.map((zone) => {
    const zoneStart = strength * zone.startMult;
    const zoneEnd = strength * zone.endMult;
    const zoneSize = zoneEnd - zoneStart;
    const widthPercent = (zoneSize / max) * 100;
    const filled = Math.max(0, Math.min(weight, zoneEnd) - zoneStart);
    const fillRatio = zoneSize > 0 ? (filled / zoneSize) * 100 : 0;

    return {
      trackClassName: zone.trackClassName,
      fillClassName: zone.fillClassName,
      widthPercent,
      fillRatio,
    };
  });
}

/** Chip label + colors for the current encumbrance step. */
export function encumbranceColors(strength: number, weight: number) {
  if (weight > strength * 30) {
    return {
      label: "Over capacity" as const,
      chipClassName: "bg-red-600 text-white",
    };
  }
  for (const zone of ENCUMBRANCE_ZONES) {
    if (weight <= strength * zone.endMult) {
      return { label: zone.label, chipClassName: zone.chipClassName };
    }
  }
  const last = ENCUMBRANCE_ZONES[ENCUMBRANCE_ZONES.length - 1];
  return { label: last.label, chipClassName: last.chipClassName };
}

/** Chip label + colors for the current encumbrance step (with translated labels). */
export function encumbranceColorsI18n(
  strength: number,
  weight: number,
  zones: EncumbranceZone[]
) {
  if (weight > strength * 30) {
    return {
      label: "Over capacity" as const,
      chipClassName: "bg-red-600 text-white",
    };
  }
  for (const zone of zones) {
    if (weight <= strength * zone.endMult) {
      return { label: zone.label, chipClassName: zone.chipClassName };
    }
  }
  const last = zones[zones.length - 1];
  return { label: last.label, chipClassName: last.chipClassName };
}

export function formatWeight(weight: number): string {
  return Number.isInteger(weight)
    ? String(weight)
    : weight.toFixed(2).replace(/0$/, "");
}

export function maxCarryWeight(strength: number): number {
  return strength * 30;
}

export function encumbrancePercent(strength: number, weight: number): number {
  const max = maxCarryWeight(strength);
  if (max <= 0) return weight > 0 ? 100 : 0;
  return Math.min(100, (weight / max) * 100);
}
