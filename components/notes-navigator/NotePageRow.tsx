import Link from "next/link";
import { FileText } from "lucide-react";
import type { NotePageSummary } from "@/lib/queries/notes";
import { Menu } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  sameTarget,
  type DropTarget,
  type NotesSidebarController,
} from "./useNotesSidebar";

export function NotePageRow({
  page,
  selected,
  controller,
}: {
  page: NotePageSummary;
  selected: boolean;
  controller: NotesSidebarController;
}) {
  const target: DropTarget = {
    type: "page",
    id: page.id,
    categoryId: page.categoryId,
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        controller.setDragItem({ type: "page", id: page.id });
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
        "group flex items-center gap-1 border-t-2",
        sameTarget(controller.dropTarget, target)
          ? "border-accent-400"
          : "border-transparent",
        controller.dragItem?.type === "page" &&
          controller.dragItem.id === page.id &&
          "opacity-40"
      )}
    >
      <Link
        href={controller.pageHref(page.id)}
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
        <Menu
          label={`Options for ${page.title}`}
          entries={controller.pageMenuEntries(page)}
        />
      </div>
    </div>
  );
}
