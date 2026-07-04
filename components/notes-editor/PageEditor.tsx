"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { editorExtensions } from "@/lib/editor/extensions";
import { EditorToolbar } from "./EditorToolbar";
import "./editor.css";

export function PageEditor({
  initialContent,
  editable = true,
  onChange,
  onSave,
  saveDisabled,
  saving,
}: {
  initialContent?: JSONContent;
  /** When false the document is rendered read-only, without the toolbar. */
  editable?: boolean;
  /** Called with the full Tiptap JSON document on every change. */
  onChange?: (contentJson: JSONContent) => void;
  /** Enables the toolbar Save button when provided. */
  onSave?: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      Placeholder.configure({
        placeholder: "Start writing your campaign notes…",
      }),
    ],
    content: initialContent,
    editable,
    // Avoid SSR hydration mismatches; the editor only exists in the browser.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id: "campaign-editor-surface",
        class: "page-editor-content focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  if (!editor) {
    // Rendered on the server and during the first client paint.
    return (
      <div className="p-5">
        <div className="h-64 animate-pulse rounded-lg bg-gray-50" />
      </div>
    );
  }

  return (
    <div id="campaign-editor-shell" className="flex min-h-0 flex-1 flex-col">
      {editable && (
        <EditorToolbar
          editor={editor}
          onSave={onSave}
          saveDisabled={saveDisabled}
          saving={saving}
        />
      )}
      <div
        className="flex-1 cursor-text px-5 py-4"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
