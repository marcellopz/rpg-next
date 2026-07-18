"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { useI18n } from "@/lib/i18n/context";
import { editorExtensions } from "@/lib/editor/extensions";
import { Button, Typography } from "@/components/ui";
import { EditorToolbar } from "./EditorToolbar";
import "./editor.css";

export function PageEditor({
  initialContent,
  editable = true,
  onChange,
  onSave,
  saveDisabled,
  saving,
  autosaveIn,
  presenceLabel,
  remoteBanner,
  onOpenHistory,
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
  /** Seconds until autosave fires; null when idle / not dirty. */
  autosaveIn?: number | null;
  presenceLabel?: string | null;
  remoteBanner?: {
    message: string;
    onReload: () => void;
    onDismiss: () => void;
  } | null;
  onOpenHistory?: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    if (!editable || !onSave) return;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!saveDisabled && !saving) onSave?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editable, onSave, saveDisabled, saving]);

  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      Placeholder.configure({
        placeholder: t("pageEditor.placeholderText"),
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
          autosaveIn={autosaveIn}
          presenceLabel={presenceLabel}
          onOpenHistory={onOpenHistory}
        />
      )}
      {!editable && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          {presenceLabel && (
            <span id="campaign-editor-presence" className="mr-auto text-xs text-accent-700">
              {presenceLabel}
            </span>
          )}
          {onOpenHistory && (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={onOpenHistory}
            >
              {t("notes.history")}
            </Button>
          )}
        </div>
      )}
      {remoteBanner && (
        <div
          id="campaign-editor-remote-banner"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2"
        >
          <Typography variant="small" className="text-amber-900">
            {remoteBanner.message}
          </Typography>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={remoteBanner.onDismiss}
            >
              {t("pageEditor.keepEditing")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xs"
              onClick={remoteBanner.onReload}
            >
              {t("pageEditor.reload")}
            </Button>
          </div>
        </div>
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
