import type {
  ResourceCard,
  ResourceItem,
  ResourcesDashboard,
} from "@/lib/resources/types";

// Pure transforms applied to the client-owned dashboard before the matching
// server action resolves. Each returns a new dashboard; none mutate in place.

function mapCard(
  dashboard: ResourcesDashboard,
  cardId: string,
  fn: (card: ResourceCard) => ResourceCard
): ResourcesDashboard {
  return {
    ...dashboard,
    cards: dashboard.cards.map((card) => (card.id === cardId ? fn(card) : card)),
  };
}

function mapItems(
  dashboard: ResourcesDashboard,
  itemId: string,
  fn: (item: ResourceItem) => ResourceItem
): ResourcesDashboard {
  return {
    ...dashboard,
    cards: dashboard.cards.map((card) =>
      card.items.some((item) => item.id === itemId)
        ? {
            ...card,
            items: card.items.map((item) =>
              item.id === itemId ? fn(item) : item
            ),
          }
        : card
    ),
  };
}

export function reorderCardItems(
  dashboard: ResourcesDashboard,
  cardId: string,
  orderedIds: string[]
): ResourcesDashboard {
  return mapCard(dashboard, cardId, (card) => {
    const byId = new Map(card.items.map((item) => [item.id, item]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((item): item is ResourceItem => item !== undefined)
      .map((item, index) => ({ ...item, sortOrder: index + 1 }));
    // Keep anything the caller's list didn't mention rather than dropping it.
    const missing = card.items.filter((item) => !orderedIds.includes(item.id));
    return { ...card, items: [...reordered, ...missing] };
  });
}

export function patchItem(
  dashboard: ResourcesDashboard,
  itemId: string,
  patch: Partial<Pick<ResourceItem, "name" | "currentValue" | "totalValue">>
): ResourcesDashboard {
  return mapItems(dashboard, itemId, (item) => ({ ...item, ...patch }));
}

export function removeItem(
  dashboard: ResourcesDashboard,
  itemId: string
): ResourcesDashboard {
  return {
    ...dashboard,
    cards: dashboard.cards.map((card) => ({
      ...card,
      items: card.items.filter((item) => item.id !== itemId),
    })),
  };
}

export function appendItem(
  dashboard: ResourcesDashboard,
  cardId: string,
  item: ResourceItem
): ResourcesDashboard {
  return mapCard(dashboard, cardId, (card) => ({
    ...card,
    items: [...card.items, item],
  }));
}

export function patchCard(
  dashboard: ResourcesDashboard,
  cardId: string,
  patch: Partial<Pick<ResourceCard, "name">>
): ResourcesDashboard {
  return mapCard(dashboard, cardId, (card) => ({ ...card, ...patch }));
}

export function removeCard(
  dashboard: ResourcesDashboard,
  cardId: string
): ResourcesDashboard {
  return {
    ...dashboard,
    cards: dashboard.cards.filter((card) => card.id !== cardId),
  };
}

/**
 * Placeholder id for a row that exists locally but not yet on the server.
 * Reconciliation replaces it with the real row.
 */
export function tempId(): string {
  return `temp-${Math.random().toString(36).slice(2)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith("temp-");
}
