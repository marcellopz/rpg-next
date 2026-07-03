"use client";

import { useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { savePage } from "@/app/actions/pages";
import type { NotePage } from "@/lib/queries/notes";
import { PageEditor } from "@/components/editor/PageEditor";

// Client wrapper that owns the save flow for the selected page: tracks the
// latest document JSON and dirty state, and runs the wipe-guard confirmation
// branch when the server blocks a suspicious save.
export function PageEditorPanel({
  page,
  canEdit,
}: {
  page: NotePage;
  canEdit: boolean;
}) {
  const contentRef = useRef<JSONContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(json: JSONContent) {
    contentRef.current = json;
    setDirty(true);
  }

  async function handleSave() {
    const content = contentRef.current;
    if (!content || saving) return;
    setSaving(true);
    try {
      let result = await savePage(page.id, content);
      if (result.ok && result.data.status === "needs_confirmation") {
        const confirmed = window.confirm(
          `This will remove most of the page (from ${result.data.oldLength} to ${result.data.newLength} characters). Save anyway?`
        );
        if (!confirmed) return;
        result = await savePage(page.id, content, true);
      }
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageEditor
      // Remount when switching pages so the document is rebuilt cleanly.
      key={page.id}
      initialContent={page.contentJson ?? undefined}
      editable={canEdit}
      onChange={handleChange}
      onSave={canEdit ? handleSave : undefined}
      saveDisabled={!dirty}
      saving={saving}
    />
  );
}
