import type { Character, InventoryItem } from "@/lib/queries/inventory";

// Pure transforms applied to the client-owned party roster before the matching
// server action resolves. Each returns a new array; none mutate in place.

function mapCharacter(
  characters: Character[],
  characterId: string,
  fn: (character: Character) => Character
): Character[] {
  return characters.map((c) => (c.id === characterId ? fn(c) : c));
}

export function patchCharacter(
  characters: Character[],
  characterId: string,
  patch: Partial<
    Pick<
      Character,
      | "name"
      | "strength"
      | "platinum"
      | "gold"
      | "silver"
      | "copper"
      | "imageUrl"
    >
  >
): Character[] {
  return mapCharacter(characters, characterId, (c) => ({ ...c, ...patch }));
}

export function removeCharacter(
  characters: Character[],
  characterId: string
): Character[] {
  return characters.filter((c) => c.id !== characterId);
}

export function reorderCharacters(
  characters: Character[],
  orderedIds: string[]
): Character[] {
  const byId = new Map(characters.map((c) => [c.id, c]));
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is Character => c !== undefined);
  // Keep anything the caller's list didn't mention rather than dropping it.
  const missing = characters.filter((c) => !orderedIds.includes(c.id));
  return [...reordered, ...missing];
}

export function reorderItems(
  characters: Character[],
  characterId: string,
  orderedIds: string[]
): Character[] {
  return mapCharacter(characters, characterId, (c) => {
    const byId = new Map(c.items.map((item) => [item.id, item]));
    const reordered = orderedIds
      .map((id) => byId.get(id))
      .filter((item): item is InventoryItem => item !== undefined);
    const missing = c.items.filter((item) => !orderedIds.includes(item.id));
    return { ...c, items: [...reordered, ...missing] };
  });
}

export function patchItem(
  characters: Character[],
  itemId: string,
  patch: Partial<Pick<InventoryItem, "name" | "itemType" | "weight" | "quantity">>
): Character[] {
  return characters.map((c) =>
    c.items.some((item) => item.id === itemId)
      ? {
          ...c,
          items: c.items.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item
          ),
        }
      : c
  );
}

export function removeItem(
  characters: Character[],
  itemId: string
): Character[] {
  return characters.map((c) => ({
    ...c,
    items: c.items.filter((item) => item.id !== itemId),
  }));
}

export function appendItem(
  characters: Character[],
  characterId: string,
  item: InventoryItem
): Character[] {
  return mapCharacter(characters, characterId, (c) => ({
    ...c,
    items: [...c.items, item],
  }));
}

/**
 * Move `quantity` of an item to another character's list. If the target
 * already has an item with the same name + weight, the quantity merges into
 * that stack; otherwise sending the full quantity moves the row as-is, and
 * sending less shrinks the source row and appends a new (temp-id) row on the
 * target. Pass `{ reconcile: true }` — a merge target's true quantity and a
 * new row's real id both need the server's answer, not this guess.
 */
export function transferItem(
  characters: Character[],
  itemId: string,
  targetCharacterId: string,
  quantity: number
): Character[] {
  const item = characters
    .flatMap((c) => c.items)
    .find((i) => i.id === itemId);
  if (!item) return characters;

  const sendingAll = quantity >= item.quantity;

  return characters.map((c) => {
    if (c.id === targetCharacterId) {
      const existingStack = c.items.find(
        (i) => i.name === item.name && i.weight === item.weight
      );
      if (existingStack) {
        return {
          ...c,
          items: c.items.map((i) =>
            i.id === existingStack.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          ),
        };
      }
      const incoming = sendingAll
        ? { ...item, characterId: targetCharacterId }
        : { ...item, id: tempId(), characterId: targetCharacterId, quantity };
      return { ...c, items: [...c.items, incoming] };
    }
    if (!c.items.some((i) => i.id === itemId)) return c;
    if (sendingAll) {
      return { ...c, items: c.items.filter((i) => i.id !== itemId) };
    }
    return {
      ...c,
      items: c.items.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i
      ),
    };
  });
}

/**
 * Placeholder id for a row that exists locally but not yet on the server.
 * Reconciliation replaces it with the real row.
 */
export function tempId(): string {
  return `temp-${Math.random().toString(36).slice(2)}`;
}
