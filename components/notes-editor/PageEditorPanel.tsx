"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { savePage } from "@/app/actions/pages";
import type { NotePage } from "@/lib/queries/notes";
import { PageEditor } from "./PageEditor";
import { PageHistoryPanel } from "./PageHistoryPanel";
import {
  type RemotePageUpdate,
  usePageLiveSync,
} from "./usePageLiveSync";
import {
  formatPresenceLabel,
  usePagePresence,
} from "./usePagePresence";

const AUTOSAVE_MS = 5000;

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
  const savingRef = useRef(false);
  const lastLocalSaveAtRef = useRef<string | null>(null);
  const appliedUpdatedAtRef = useRef(page.updatedAt);
  const dirtyRef = useRef(false);

  const [dirty, setDirty] = useState(false);
  const [dirtyEpoch, setDirtyEpoch] = useState(0);
  const [saving, setSaving] = useState(false);
  const [autosaveIn, setAutosaveIn] = useState<number | null>(null);
  const [autosavePaused, setAutosavePaused] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [remoteUpdate, setRemoteUpdate] = useState<RemotePageUpdate | null>(
    null
  );
  const [editorContent, setEditorContent] = useState<JSONContent | undefined>(
    page.contentJson ?? undefined
  );
  const [editorKey, setEditorKey] = useState(0);

  const presenceOthers = usePagePresence(page.id);
  const presenceLabel = formatPresenceLabel(presenceOthers);

  dirtyRef.current = dirty;

  useEffect(() => {
    contentRef.current = null;
    savingRef.current = false;
    lastLocalSaveAtRef.current = null;
    appliedUpdatedAtRef.current = page.updatedAt;
    dirtyRef.current = false;
    setDirty(false);
    setDirtyEpoch(0);
    setSaving(false);
    setAutosaveIn(null);
    setAutosavePaused(false);
    setHistoryOpen(false);
    setRemoteUpdate(null);
    setEditorContent(page.contentJson ?? undefined);
    setEditorKey(0);
    // Only reset when navigating to a different page — not on every server refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: page.id only
  }, [page.id]);

  const applyRemoteContent = useCallback((update: RemotePageUpdate) => {
    contentRef.current = update.contentJson;
    appliedUpdatedAtRef.current = update.updatedAt;
    setEditorContent(update.contentJson ?? undefined);
    setDirty(false);
    dirtyRef.current = false;
    setAutosaveIn(null);
    setAutosavePaused(false);
    setRemoteUpdate(null);
    setEditorKey((key) => key + 1);
  }, []);

  const handleRemoteUpdate = useCallback(
    (update: RemotePageUpdate) => {
      if (update.updatedAt === appliedUpdatedAtRef.current) return;
      if (update.updatedAt === lastLocalSaveAtRef.current) {
        appliedUpdatedAtRef.current = update.updatedAt;
        return;
      }

      if (dirtyRef.current) {
        setRemoteUpdate(update);
        return;
      }

      applyRemoteContent(update);
    },
    [applyRemoteContent]
  );

  usePageLiveSync({
    pageId: page.id,
    getIgnoreUpdatedAt: () => lastLocalSaveAtRef.current,
    onRemoteUpdate: handleRemoteUpdate,
  });

  async function handleSave() {
    const content = contentRef.current;
    if (!content || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setAutosaveIn(null);
    try {
      let result = await savePage(page.id, content);
      if (result.ok && result.data.status === "needs_confirmation") {
        const confirmed = window.confirm(
          `This will remove most of the page (from ${result.data.oldLength} to ${result.data.newLength} characters). Save anyway?`
        );
        if (!confirmed) {
          setAutosavePaused(true);
          return;
        }
        result = await savePage(page.id, content, true);
      }
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      if (result.data.status === "saved") {
        lastLocalSaveAtRef.current = result.data.updatedAt;
        appliedUpdatedAtRef.current = result.data.updatedAt;
        setDirty(false);
        dirtyRef.current = false;
        setRemoteUpdate(null);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  // Autosave after 5s of inactivity while there are unsaved changes.
  useEffect(() => {
    if (!canEdit || !dirty || saving || autosavePaused) {
      setAutosaveIn(null);
      return;
    }

    const startedAt = Date.now();
    setAutosaveIn(Math.ceil(AUTOSAVE_MS / 1000));

    const tick = window.setInterval(() => {
      const remainingMs = AUTOSAVE_MS - (Date.now() - startedAt);
      setAutosaveIn(Math.max(0, Math.ceil(remainingMs / 1000)));
    }, 200);

    const timer = window.setTimeout(() => {
      void handleSave();
    }, AUTOSAVE_MS);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(tick);
    };
    // handleSave closes over page.id / refs; dirtyEpoch resets the idle clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, dirty, dirtyEpoch, saving, autosavePaused, page.id]);

  function handleChange(json: JSONContent) {
    contentRef.current = json;
    setDirty(true);
    dirtyRef.current = true;
    setAutosavePaused(false);
    setDirtyEpoch((epoch) => epoch + 1);
  }

  function handleRestored(contentJson: JSONContent) {
    contentRef.current = contentJson;
    setEditorContent(contentJson);
    setDirty(false);
    dirtyRef.current = false;
    setAutosaveIn(null);
    setRemoteUpdate(null);
    setEditorKey((key) => key + 1);
  }

  return (
    <>
      <PageEditor
        // Remount when switching pages or after a history restore / remote sync.
        key={`${page.id}-${editorKey}`}
        initialContent={editorContent}
        editable={canEdit}
        onChange={handleChange}
        onSave={canEdit ? () => void handleSave() : undefined}
        saveDisabled={!dirty}
        saving={saving}
        autosaveIn={dirty && !saving && !autosavePaused ? autosaveIn : null}
        presenceLabel={presenceLabel}
        remoteBanner={
          remoteUpdate
            ? {
                message: `${remoteUpdate.lastSavedByName} saved a newer version`,
                onReload: () => applyRemoteContent(remoteUpdate),
                onDismiss: () => setRemoteUpdate(null),
              }
            : null
        }
        onOpenHistory={() => setHistoryOpen(true)}
      />
      {historyOpen && (
        <PageHistoryPanel
          pageId={page.id}
          canRestore={canEdit}
          onClose={() => setHistoryOpen(false)}
          onRestored={handleRestored}
        />
      )}
    </>
  );
}
