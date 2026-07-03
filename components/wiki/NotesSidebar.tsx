"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
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
import { cn } from "@/lib/cn";
import { Menu, Typography, type MenuEntry } from "@/components/ui";
import { NewItemForm } from "./NewItemForm";

const CATEGORY_NAME_MAX = 80;
const PAGE_TITLE_MAX = 200;

type DragItem =
  | { type: "category"; id: string }
  | { type: "page"; id: string };

type DropTarget =
  // Insert the dragged category before this one / drop a page into it.
  | { type: "category"; id: string }
  // Insert the dragged page before this page, inside its container.
  | { type: "page"; id: string; categoryId: string | null }
  // Append the dragged page at the end of the root list.
  | { type: "root-end" };

function sameTarget(a: DropTarget | null, b: DropTarget): boolean {
  if (!a || a.type !== b.type) return false;
  if (a.type === "root-end") return true;
  return (a as { id: string }).id === (b as { id: string }).id;
}

// The notes navigator: Campaign notes / My notes tabs, collapsible category
// groups with their pages, root-level pages, and create/rename/move/delete
// controls. Selection is URL-driven (?tab= & ?page=) so it stays linkable.
// Ordering is drag-and-drop (native HTML5 DnD), persisted via sort_order.
export function NotesSidebar({
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
  // Categories are expanded by default; ids in this set are collapsed.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  function toggleCategory(id: string) {
    setCollapsedIds((prev) => {
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

  // ----- drag and drop ------------------------------------------------------

  function containerPages(categoryId: string | null): NotePageSummary[] {
    if (categoryId === null) return tree.rootPages;
    return tree.categories.find((c) => c.id === categoryId)?.pages ?? [];
  }

  function clearDrag() {
    setDragItem(null);
    setDropTarget(null);
  }

  function handleDragOver(e: React.DragEvent, target: DropTarget) {
    if (!dragItem) return;
    // Categories only reorder against other categories; pages go anywhere.
    if (dragItem.type === "category" && target.type !== "category") return;
    if (dragItem.type === "category" && target.type === "category" && dragItem.id === target.id)
      return;
    if (dragItem.type === "page" && target.type === "page" && dragItem.id === target.id)
      return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget((prev) => (sameTarget(prev, target) ? prev : target));
  }

  async function handleDrop(e: React.DragEvent, target: DropTarget) {
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

    // Dragging a page: work out the target container and position.
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
      // Reveal the drop result.
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(target.id);
        return next;
      });
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

  // ----- CRUD handlers ------------------------------------------------------

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
    // Make sure the new page is visible and open it.
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(category.id);
      return next;
    });
    router.push(pageHref(result.data.id));
    router.refresh();
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
      // The selected page is gone; drop the ?page= param.
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

  // ----- rendering ----------------------------------------------------------

  function renderPage(page: NotePageSummary) {
    const selected = page.id === selectedPageId;
    const target: DropTarget = { type: "page", id: page.id, categoryId: page.categoryId };
    return (
      <div
        key={page.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          setDragItem({ type: "page", id: page.id });
        }}
        onDragEnd={clearDrag}
        onDragOver={(e) => handleDragOver(e, target)}
        onDragLeave={() => setDropTarget((prev) => (sameTarget(prev, target) ? null : prev))}
        onDrop={(e) => handleDrop(e, target)}
        className={cn(
          "group flex items-center gap-1 border-t-2",
          sameTarget(dropTarget, target) ? "border-accent-400" : "border-transparent",
          dragItem?.type === "page" && dragItem.id === page.id && "opacity-40"
        )}
      >
        <Link
          href={pageHref(page.id)}
          draggable={false}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
            selected
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <FileText className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="truncate">{page.title}</span>
        </Link>
        <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Menu label={`Options for ${page.title}`} entries={pageMenuEntries(page)} />
        </div>
      </div>
    );
  }

  const isEmpty = tree.categories.length === 0 && tree.rootPages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div id="campaign-notes-tabs" className="flex rounded-xl bg-gray-100 p-1 text-xs font-medium">
        <Link
          href={basePath}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-center",
            activeTab === "campaign"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Campaign notes
        </Link>
        <Link
          href={`${basePath}?tab=my`}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-center",
            activeTab === "personal"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          My notes
        </Link>
      </div>

      <div id="campaign-category-tree" className="mt-4 flex-1 space-y-4">
        {isEmpty && (
          <Typography variant="muted" className="px-3 py-2">
            {activeTab === "campaign"
              ? "No notes yet. Create the first category or page below."
              : "Your private notes live here. Only you can see them."}
          </Typography>
        )}

        {tree.categories.map((category) => {
          const isCollapsed = collapsedIds.has(category.id);
          const target: DropTarget = { type: "category", id: category.id };
          const isDropTarget = sameTarget(dropTarget, target);
          return (
            <div key={category.id}>
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragItem({ type: "category", id: category.id });
                }}
                onDragEnd={clearDrag}
                onDragOver={(e) => handleDragOver(e, target)}
                onDragLeave={() =>
                  setDropTarget((prev) => (sameTarget(prev, target) ? null : prev))
                }
                onDrop={(e) => handleDrop(e, target)}
                className={cn(
                  "group flex items-center gap-1 rounded-lg border-t-2 border-transparent",
                  // A category being reordered shows a line; a page hovering
                  // over the header highlights the whole row instead.
                  isDropTarget && dragItem?.type === "category" && "border-accent-400",
                  isDropTarget && dragItem?.type === "page" && "bg-accent-50 ring-1 ring-accent-300",
                  dragItem?.type === "category" && dragItem.id === category.id && "opacity-40"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={!isCollapsed}
                  className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                  <Folder className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{category.name}</span>
                </button>
                <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <Menu
                    label={`Options for ${category.name}`}
                    entries={[
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
                    ]}
                  />
                </div>
              </div>
              {!isCollapsed && (
                <div className="mt-1 space-y-1 pl-5">
                  {category.pages.map(renderPage)}
                  {category.pages.length === 0 && (
                    <Typography variant="small" as="p" className="px-3 py-1.5 text-gray-400">
                      No pages
                    </Typography>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {tree.rootPages.length > 0 && (
          <div className="space-y-1">{tree.rootPages.map(renderPage)}</div>
        )}

        {/* Drop zone to move a page to the end of the top level; only visible
            while a page is being dragged. */}
        {dragItem?.type === "page" && (
          <div
            onDragOver={(e) => handleDragOver(e, { type: "root-end" })}
            onDragLeave={() =>
              setDropTarget((prev) => (prev?.type === "root-end" ? null : prev))
            }
            onDrop={(e) => handleDrop(e, { type: "root-end" })}
            className={cn(
              "rounded-lg border border-dashed px-3 py-2 text-center text-xs",
              dropTarget?.type === "root-end"
                ? "border-accent-400 bg-accent-50 text-accent-700"
                : "border-gray-300 text-gray-400"
            )}
          >
            Move to top level
          </div>
        )}
      </div>

      <div id="campaign-sidebar-actions" className="mt-5 grid gap-2">
        <NewItemForm
          label="New category"
          placeholder="Category name"
          maxLength={CATEGORY_NAME_MAX}
          onSubmit={async (name) => {
            const result = await createCategory({
              campaignId,
              name,
              scope: activeTab,
            });
            if (!result.ok) return result.error;
            router.refresh();
            return null;
          }}
        />
        <NewItemForm
          label="New page"
          placeholder="Page title"
          maxLength={PAGE_TITLE_MAX}
          onSubmit={async (title) => {
            const result = await createPage({
              campaignId,
              title,
              scope: activeTab,
            });
            if (!result.ok) return result.error;
            router.push(pageHref(result.data.id));
            router.refresh();
            return null;
          }}
        />
      </div>
    </div>
  );
}
