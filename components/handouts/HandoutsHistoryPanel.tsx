"use client";

import { useEffect, useState } from "react";
import {
  listHandoutHistory,
  type HandoutHistoryEntry,
} from "@/app/actions/files";
import { formatBytes } from "@/lib/files/types";
import { relativeTime } from "@/lib/users/relative-time";
import { Button, Chip, Typography } from "@/components/ui";

export function HandoutsHistoryPanel({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<HandoutHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const result = await listHandoutHistory(campaignId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setEntries([]);
      } else {
        setEntries(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  return (
    <div
      id="handouts-history-modal"
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
        aria-labelledby="handouts-history-title"
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <Typography variant="h3" as="h2" id="handouts-history-title">
              Handouts history
            </Typography>
            <Typography variant="small" className="mt-0.5">
              Who uploaded what, and when
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
          {!loading && !error && entries.length === 0 && (
            <Typography variant="muted">
              No uploads yet. Shared and personal handouts will show up here.
            </Typography>
          )}

          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">
                    {entry.filename}
                  </p>
                  <Chip
                    variant={
                      entry.visibility === "public" ? "accent" : "neutral"
                    }
                  >
                    {entry.visibility === "public" ? "Shared" : "Personal"}
                  </Chip>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {entry.uploaderName} · {relativeTime(entry.createdAt)} ·{" "}
                  {formatBytes(entry.sizeBytes)}
                  {entry.contentType ? ` · ${entry.contentType}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
