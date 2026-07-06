import type { Layout, Layouts } from "react-grid-layout";
import { EMPTY_LAYOUTS, type DashboardLayouts } from "@/lib/resources/types";

const BREAKPOINTS = ["lg", "md", "sm", "xs", "xxs"] as const;
type Breakpoint = (typeof BREAKPOINTS)[number];

const DEFAULT_CARD_SIZE: Record<Breakpoint, { w: number; h: number }> = {
  lg: { w: 2, h: 6 },
  md: { w: 1, h: 6 },
  sm: { w: 1, h: 6 },
  xs: { w: 1, h: 6 },
  xxs: { w: 1, h: 6 },
};

function nextY(layout: DashboardLayouts[Breakpoint] | undefined): number {
  if (!layout?.length) return 0;
  return layout.reduce(
    (max: number, item) => Math.max(max, item.y + item.h),
    0
  );
}

/** Append a new card id to every breakpoint layout. */
export function appendCardToLayouts(
  layouts: DashboardLayouts,
  cardId: string
): DashboardLayouts {
  const next: DashboardLayouts = { ...EMPTY_LAYOUTS, ...layouts };
  for (const bp of BREAKPOINTS) {
    const current = [...(next[bp] ?? [])];
    const size = DEFAULT_CARD_SIZE[bp];
    current.push({
      i: cardId,
      x: 0,
      y: nextY(current),
      w: size.w,
      h: size.h,
    });
    next[bp] = current;
  }
  return next;
}

/** Remove a card id from every breakpoint layout. */
export function removeCardFromLayouts(
  layouts: DashboardLayouts,
  cardId: string
): DashboardLayouts {
  const next: DashboardLayouts = { ...layouts };
  for (const bp of BREAKPOINTS) {
    next[bp] = (next[bp] ?? []).filter((item) => item.i !== cardId);
  }
  return next;
}

/** Ensure every card has a layout entry (for cards created before layout save). */
export function syncLayoutsWithCards(
  layouts: DashboardLayouts,
  cardIds: string[]
): Layouts {
  let next: DashboardLayouts = { ...EMPTY_LAYOUTS, ...layouts };
  const existing = new Set(
    BREAKPOINTS.flatMap((bp) => (next[bp] ?? []).map((item) => item.i))
  );
  for (const cardId of cardIds) {
    if (!existing.has(cardId)) {
      next = appendCardToLayouts(next, cardId);
    }
  }
  return next as Layouts;
}
