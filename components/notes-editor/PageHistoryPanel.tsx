"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import {
  listPageSnapshots,
  restorePageSnapshot,
  type PageSnapshotSummary,
} from "@/app/actions/pages";
import { relativeTime } from "@/lib/users/relative-time";
import { Button, Typography } from "@/components/ui";

export function PageHistoryPanel({
  pageId,
  canRestore,
  onClose,
  onRestored,
}: {
  pageId: string;
  canRestore: boolean;
  onClose: () => void;
  onRestored: (contentJson: JSONContent) => void;
}) {
  const [snapshots, setSnapshots] = useState<PageSnapshotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await listPageSnapshots(pageId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setSnapshots([]);
      } else {
        setSnapshots(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  async function handleRestore(snapshotId: string) {
    const confirmed = window.confirm(
      "Restore this version? The current page content will be saved in history first."
    );
    if (!confirmed) return;

    setRestoringId(snapshotId);
    const result = await restorePageSnapshot(snapshotId);
    setRestoringId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onRestored(result.data.contentJson);
    onClose();
  }

  return (
    <div
      id="page-history-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-history-title"
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <Typography variant="h3" as="h2" id="page-history-title">
              Page history
            </Typography>
            <Typography variant="small" className="mt-0.5">
              Up to 10 recent saves
            </Typography>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <Typography variant="muted">Loading history…</Typography>
          )}
          {error && (
            <Typography variant="small" className="text-red-600">
              {error}
            </Typography>
          )}
          {!loading && !error && snapshots.length === 0 && (
            <Typography variant="muted">
              No snapshots yet. Saves appear here after you edit this page.
            </Typography>
          )}

          <ol className="space-y-3">
            {snapshots.map((snapshot) => (
              <li
                key={snapshot.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {snapshot.preview}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    {snapshot.savedByName} · {relativeTime(snapshot.createdAt)} ·{" "}
                    {snapshot.charCount} characters
                  </p>
                  {canRestore && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      disabled={restoringId === snapshot.id}
                      onClick={() => void handleRestore(snapshot.id)}
                    >
                      {restoringId === snapshot.id ? "Restoring…" : "Restore"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
