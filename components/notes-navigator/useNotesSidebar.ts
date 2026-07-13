"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type DragEvent } from "react";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from "@/app/actions/categories";
import {
  createPage,
  deletePage,
  movePage,
  renamePage,
  reorderPages,
} from "@/app/actions/pages";
import type { NoteScope } from "@/app/actions/categories";
import type { NoteCategory, NotePageSummary, NoteTree } from "@/lib/queries/notes";
import type { MenuEntry } from "@/components/ui";

export const CATEGORY_NAME_MAX = 80;
export const PAGE_TITLE_MAX = 200;

export type DragItem =
  | { type: "category"; id: string }
  | { type: "page"; id: string };

export type DropTarget =
  // Insert the dragged category before this one / drop a page into it.
  | { type: "category"; id: string }
  // Insert the dragged page before this page, inside its container.
  | { type: "page"; id: string; categoryId: string | null }
  // Append the dragged page at the end of the root list.
  | { type: "root-end" };

export function sameTarget(a: DropTarget | null, b: DropTarget): boolean {
  if (!a || a.type !== b.type) return false;
  if (a.type === "root-end") return true;
  return (a as { id: string }).id === (b as { id: string }).id;
}

export function useNotesSidebar({
  campaignId,
  publicCode,
  tree,
  activeTab,
  selectedPageId,
}: {
  campaignId: string;
  publicCode: string;
  tree: NoteTree;
  activeTab: NoteScope;
  selectedPageId: string | null;
}) {
  const router = useRouter();
  const basePath = `/campaigns/${publicCode}`;
  const tabQuery = activeTab === "personal" ? "?tab=my" : "";
  const selectedCategoryId =
    tree.categories.find((c) => c.pages.some((p) => p.id === selectedPageId))
      ?.id ?? null;

  // Categories start closed; only the selected page's category opens.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(selectedCategoryId ? [selectedCategoryId] : [])
  );
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  // When the selection moves into another category (search result, new page,
  // default page), open that category so the selected row is visible.
  useEffect(() => {
    if (selectedCategoryId) expandCategory(selectedCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  function toggleCategory(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pageHref(pageId: string) {
    const params = new URLSearchParams();
    if (activeTab === "personal") params.set("tab", "my");
    params.set("page", pageId);
    return `${basePath}?${params.toString()}`;
  }

  function containerPages(categoryId: string | null): NotePageSummary[] {
    if (categoryId === null) return tree.rootPages;
    return tree.categories.find((c) => c.id === categoryId)?.pages ?? [];
  }

  function clearDrag() {
    setDragItem(null);
    setDropTarget(null);
  }

  function handleDragOver(e: DragEvent, target: DropTarget) {
    if (!dragItem) return;
    if (dragItem.type === "category" && target.type !== "category") return;
    if (
      dragItem.type === "category" &&
      target.type === "category" &&
      dragItem.id === target.id
    )
      return;
    if (
      dragItem.type === "page" &&
      target.type === "page" &&
      dragItem.id === target.id
    )
      return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget((prev) => (sameTarget(prev, target) ? prev : target));
  }

  async function handleDrop(e: DragEvent, target: DropTarget) {
    e.preventDefault();
    const item = dragItem;
    clearDrag();
    if (!item) return;

    if (item.type === "category") {
      if (target.type !== "category") return;
      const ids = tree.categories.map((c) => c.id).filter((id) => id !== item.id);
      const at = ids.indexOf(target.id);
      if (at === -1) return;
      ids.splice(at, 0, item.id);
      const result = await reorderCategories({
        campaignId,
        scope: activeTab,
        orderedIds: ids,
      });
      if (!result.ok) window.alert(result.error);
      router.refresh();
      return;
    }

    let categoryId: string | null;
    let orderedIds: string[];
    if (target.type === "page") {
      categoryId = target.categoryId;
      orderedIds = containerPages(categoryId)
        .map((p) => p.id)
        .filter((id) => id !== item.id);
      const at = orderedIds.indexOf(target.id);
      if (at === -1) return;
      orderedIds.splice(at, 0, item.id);
    } else if (target.type === "category") {
      categoryId = target.id;
      orderedIds = containerPages(categoryId)
        .map((p) => p.id)
        .filter((id) => id !== item.id);
      orderedIds.push(item.id);
      expandCategory(target.id);
    } else {
      categoryId = null;
      orderedIds = tree.rootPages.map((p) => p.id).filter((id) => id !== item.id);
      orderedIds.push(item.id);
    }

    const result = await reorderPages({
      campaignId,
      scope: activeTab,
      categoryId,
      orderedIds,
    });
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  function expandCategory(id: string) {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function handleRenameCategory(id: string, currentName: string) {
    const name = window.prompt("Rename category", currentName)?.trim();
    if (!name || name === currentName) return;
    const result = await renameCategory(id, name);
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (
      !window.confirm(
        `Delete the category "${name}"? Its pages move to the top level.`
      )
    )
      return;
    const result = await deleteCategory(id);
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function handleAddPageToCategory(category: NoteCategory) {
    const title = window.prompt(`New page in "${category.name}"`)?.trim();
    if (!title) return;
    const result = await createPage({
      campaignId,
      categoryId: category.id,
      title,
      scope: activeTab,
    });
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    expandCategory(category.id);
    // No refresh needed: pushing the new page's URL fetches a fresh render.
    router.push(pageHref(result.data.id));
  }

  async function handleRenamePage(page: NotePageSummary) {
    const title = window.prompt("Rename page", page.title)?.trim();
    if (!title || title === page.title) return;
    const result = await renamePage(page.id, title);
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function handleMovePage(page: NotePageSummary, categoryId: string | null) {
    const result = await movePage(page.id, categoryId);
    if (!result.ok) window.alert(result.error);
    router.refresh();
  }

  async function handleDeletePage(page: NotePageSummary) {
    if (!window.confirm(`Delete the page "${page.title}"?`)) return;
    const result = await deletePage(page.id);
    if (!result.ok) {
      window.alert(result.error);
      return;
    }
    if (page.id === selectedPageId) {
      router.push(`${basePath}${tabQuery}`);
    }
    router.refresh();
  }

  function pageMenuEntries(page: NotePageSummary): MenuEntry[] {
    const moveTargets: MenuEntry[] = tree.categories
      .filter((c) => c.id !== page.categoryId)
      .map((c) => ({
        label: `Move to ${c.name}`,
        onSelect: () => handleMovePage(page, c.id),
      }));
    if (page.categoryId !== null) {
      moveTargets.push({
        label: "Move to top level",
        onSelect: () => handleMovePage(page, null),
      });
    }
    return [
      { label: "Rename", onSelect: () => handleRenamePage(page) },
      ...moveTargets,
      { label: "Delete", onSelect: () => handleDeletePage(page), danger: true },
    ];
  }

  function categoryMenuEntries(category: NoteCategory): MenuEntry[] {
    return [
      {
        label: "Add page",
        onSelect: () => handleAddPageToCategory(category),
      },
      {
        label: "Rename",
        onSelect: () => handleRenameCategory(category.id, category.name),
      },
      {
        label: "Delete",
        onSelect: () => handleDeleteCategory(category.id, category.name),
        danger: true,
      },
    ];
  }

  async function createRootCategory(name: string): Promise<string | null> {
    const result = await createCategory({
      campaignId,
      name,
      scope: activeTab,
    });
    if (!result.ok) return result.error;
    router.refresh();
    return null;
  }

  async function createRootPage(title: string): Promise<string | null> {
    const result = await createPage({
      campaignId,
      title,
      scope: activeTab,
    });
    if (!result.ok) return result.error;
    // No refresh needed: pushing the new page's URL fetches a fresh render.
    router.push(pageHref(result.data.id));
    return null;
  }

  return {
    activeTab,
    basePath,
    expandedIds,
    dragItem,
    dropTarget,
    pageHref,
    toggleCategory,
    setDragItem,
    setDropTarget,
    clearDrag,
    handleDragOver,
    handleDrop,
    pageMenuEntries,
    categoryMenuEntries,
    createRootCategory,
    createRootPage,
  };
}

export type NotesSidebarController = ReturnType<typeof useNotesSidebar>;
