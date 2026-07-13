import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import type { NoteCategory } from "@/lib/queries/notes";
import { Menu, Typography } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  sameTarget,
  type DropTarget,
  type NotesSidebarController,
} from "./useNotesSidebar";
import { NotePageRow } from "./NotePageRow";

export function NoteCategoryGroup({
  category,
  selectedPageId,
  controller,
}: {
  category: NoteCategory;
  selectedPageId: string | null;
  controller: NotesSidebarController;
}) {
  const isCollapsed = !controller.expandedIds.has(category.id);
  const target: DropTarget = { type: "category", id: category.id };
  const isDropTarget = sameTarget(controller.dropTarget, target);

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          controller.setDragItem({ type: "category", id: category.id });
        }}
        onDragEnd={controller.clearDrag}
        onDragOver={(e) => controller.handleDragOver(e, target)}
        onDragLeave={() =>
          controller.setDropTarget((prev) =>
            sameTarget(prev, target) ? null : prev
          )
        }
        onDrop={(e) => controller.handleDrop(e, target)}
        className={cn(
          "group flex items-center gap-1 rounded-lg border-t-2 border-transparent",
          isDropTarget &&
            controller.dragItem?.type === "category" &&
            "border-accent-400",
          isDropTarget &&
            controller.dragItem?.type === "page" &&
            "bg-accent-50 ring-1 ring-accent-300",
          controller.dragItem?.type === "category" &&
            controller.dragItem.id === category.id &&
            "opacity-40"
        )}
      >
        <button
          type="button"
          onClick={() => controller.toggleCategory(category.id)}
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
            entries={controller.categoryMenuEntries(category)}
          />
        </div>
      </div>
      {!isCollapsed && (
        <div className="mt-1 space-y-1 pl-5">
          {category.pages.map((page) => (
            <NotePageRow
              key={page.id}
              page={page}
              selected={page.id === selectedPageId}
              controller={controller}
            />
          ))}
          {category.pages.length === 0 && (
            <Typography
              variant="small"
              as="p"
              className="px-3 py-1.5 text-gray-400"
            >
              No pages
            </Typography>
          )}
        </div>
      )}
    </div>
  );
}
