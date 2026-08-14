"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  linkPinToPage,
  listNotePageOptions,
  type NotePageOption,
} from "@/app/actions/map-pin-links";
import { useI18n } from "@/lib/i18n/context";
import { Chip, Typography } from "@/components/ui";

export function LinkNoteDialog({
  pinId,
  campaignId,
  linkedPageIds,
  onClose,
  onLinked,
}: {
  pinId: string;
  campaignId: string;
  /** Already-linked pages are hidden from the picker. */
  linkedPageIds: Set<string>;
  onClose: () => void;
  onLinked: () => void;
}) {
  const { t } = useI18n();
  const [options, setOptions] = useState<NotePageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listNotePageOptions(campaignId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
      } else {
        setOptions(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !linkedPageIds.has(o.id))
      .filter((o) => !q || o.title.toLowerCase().includes(q));
  }, [options, linkedPageIds, query]);

  async function handleLink(pageId: string) {
    setLinkingId(pageId);
    const result = await linkPinToPage({ pinId, pageId });
    setLinkingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onLinked();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-note-title"
        className="relative flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 p-4">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            id="link-note-title"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("map.searchNotes")}
            className="min-w-0 flex-1 border-none p-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {loading && (
            <Typography variant="muted" className="py-4 text-center text-sm">
              {t("buttons.loading")}
            </Typography>
          )}
          {error && (
            <Typography variant="small" className="px-1 text-red-600">
              {error}
            </Typography>
          )}
          {!loading && !error && filtered.length === 0 && (
            <Typography variant="muted" className="py-4 text-center text-sm">
              {t("map.noNotesFound")}
            </Typography>
          )}
          {!loading &&
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={linkingId === option.id}
                onClick={() => void handleLink(option.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent-50 disabled:opacity-50"
              >
                <span className="truncate text-gray-800">{option.title}</span>
                {option.visibility === "private" && (
                  <Chip variant="neutral">{t("notes.personal")}</Chip>
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
