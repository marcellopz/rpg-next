import { cn } from "@/lib/cn";
import type { NotesSidebarController } from "./useNotesSidebar";

export function RootPageDropZone({
  controller,
}: {
  controller: NotesSidebarController;
}) {
  if (controller.dragItem?.type !== "page") return null;

  return (
    <div
      onDragOver={(e) => controller.handleDragOver(e, { type: "root-end" })}
      onDragLeave={() =>
        controller.setDropTarget((prev) =>
          prev?.type === "root-end" ? null : prev
        )
      }
      onDrop={(e) => controller.handleDrop(e, { type: "root-end" })}
      className={cn(
        "rounded-lg border border-dashed px-3 py-2 text-center text-xs",
        controller.dropTarget?.type === "root-end"
          ? "border-accent-400 bg-accent-50 text-accent-700"
          : "border-gray-300 text-gray-400"
      )}
    >
      Move to top level
    </div>
  );
}
