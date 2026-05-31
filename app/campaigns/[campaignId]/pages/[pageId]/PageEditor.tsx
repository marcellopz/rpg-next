"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { editorExtensions } from "@/lib/editor/extensions";
import { savePage } from "@/app/actions/pages";

export function PageEditor({
  pageId,
  initialContent,
}: {
  pageId: string;
  initialContent: JSONContent | null;
}) {
  const [status, setStatus] = useState<string>("");
  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent ?? "",
    // Avoid SSR hydration mismatch — render the editor on the client only.
    immediatelyRender: false,
  });

  async function handleSave() {
    if (!editor) return;
    const json = editor.getJSON();
    setStatus("Saving…");
    const res = await savePage(pageId, json); // first attempt
    if (res.status === "needs_confirmation") {
      const ok = window.confirm(
        `This will remove most of the page (from ${res.oldLength} to ${res.newLength} characters). Save anyway?`
      );
      if (!ok) {
        setStatus("Save cancelled.");
        return;
      }
      await savePage(pageId, json, true); // confirmed: bypasses guard, keeps backups
    }
    setStatus("Saved.");
  }

  return (
    <div className="space-y-3">
      <div className="rounded border border-gray-800 p-3">
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          Save
        </button>
        <span className="text-sm text-gray-500">{status}</span>
      </div>
    </div>
  );
}
