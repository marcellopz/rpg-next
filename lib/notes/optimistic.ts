import type { NotePageSummary, NoteTree } from "@/lib/queries/notes";

// Pure transforms applied to the client-owned sidebar tree before the matching
// server action resolves. Each returns a new tree; none mutate in place.

export function renameCategory(
  tree: NoteTree,
  categoryId: string,
  name: string
): NoteTree {
  return {
    ...tree,
    categories: tree.categories.map((c) =>
      c.id === categoryId ? { ...c, name } : c
    ),
  };
}

/** Deleting a category moves its pages to the top level (matches the server). */
export function removeCategory(
  tree: NoteTree,
  categoryId: string
): NoteTree {
  const orphaned = (
    tree.categories.find((c) => c.id === categoryId)?.pages ?? []
  ).map((p) => ({ ...p, categoryId: null }));

  return {
    categories: tree.categories.filter((c) => c.id !== categoryId),
    rootPages: [...tree.rootPages, ...orphaned],
  };
}

export function reorderCategories(
  tree: NoteTree,
  orderedIds: string[]
): NoteTree {
  const byId = new Map(tree.categories.map((c) => [c.id, c]));
  const reordered = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is NoteTree["categories"][number] => c !== undefined);
  const missing = tree.categories.filter((c) => !orderedIds.includes(c.id));
  return { ...tree, categories: [...reordered, ...missing] };
}

export function renamePage(
  tree: NoteTree,
  pageId: string,
  title: string
): NoteTree {
  const patch = (p: NotePageSummary) =>
    p.id === pageId ? { ...p, title } : p;
  return {
    categories: tree.categories.map((c) => ({
      ...c,
      pages: c.pages.map(patch),
    })),
    rootPages: tree.rootPages.map(patch),
  };
}

export function removePage(tree: NoteTree, pageId: string): NoteTree {
  return {
    categories: tree.categories.map((c) => ({
      ...c,
      pages: c.pages.filter((p) => p.id !== pageId),
    })),
    rootPages: tree.rootPages.filter((p) => p.id !== pageId),
  };
}

function findPage(tree: NoteTree, pageId: string): NotePageSummary | null {
  for (const c of tree.categories) {
    const hit = c.pages.find((p) => p.id === pageId);
    if (hit) return hit;
  }
  return tree.rootPages.find((p) => p.id === pageId) ?? null;
}

/** Move a page into a category (or to the top level), appending at the end. */
export function movePage(
  tree: NoteTree,
  pageId: string,
  categoryId: string | null
): NoteTree {
  const page = findPage(tree, pageId);
  if (!page) return tree;
  const moved = { ...page, categoryId };
  const without = removePage(tree, pageId);

  if (categoryId === null) {
    return { ...without, rootPages: [...without.rootPages, moved] };
  }
  return {
    ...without,
    categories: without.categories.map((c) =>
      c.id === categoryId ? { ...c, pages: [...c.pages, moved] } : c
    ),
  };
}

/**
 * Apply a reorder within one container: `orderedIds` is the new order of the
 * pages in `categoryId` (null = top level), and any page named in the list is
 * moved into that container.
 */
export function reorderPages(
  tree: NoteTree,
  categoryId: string | null,
  orderedIds: string[]
): NoteTree {
  const byId = new Map<string, NotePageSummary>();
  for (const c of tree.categories) {
    for (const p of c.pages) byId.set(p.id, p);
  }
  for (const p of tree.rootPages) byId.set(p.id, p);

  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is NotePageSummary => p !== undefined)
    .map((p) => ({ ...p, categoryId }));
  const movedIds = new Set(ordered.map((p) => p.id));

  return {
    categories: tree.categories.map((c) => ({
      ...c,
      pages:
        c.id === categoryId
          ? ordered
          : c.pages.filter((p) => !movedIds.has(p.id)),
    })),
    rootPages:
      categoryId === null
        ? ordered
        : tree.rootPages.filter((p) => !movedIds.has(p.id)),
  };
}
