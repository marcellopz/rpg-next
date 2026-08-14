"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  linkPinToPage,
  listMapPinOptions,
  type MapPinOption,
} from "@/app/actions/map-pin-links";
import { useI18n } from "@/lib/i18n/context";
import { PIN_TYPE_STYLES } from "@/lib/map/types";

export function LinkPinDialog({
  pageId,
  campaignId,
  linkedPinIds,
  onClose,
  onLinked,
}: {
  pageId: string;
  campaignId: string;
  /** Already-linked pins are hidden from the picker. */
  linkedPinIds: Set<string>;
  onClose: () => void;
  onLinked: () => void;
}) {
  const { t } = useI18n();
  const [options, setOptions] = useState<MapPinOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listMapPinOptions(campaignId);
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
      .filter((o) => !linkedPinIds.has(o.id))
      .filter((o) => !q || o.label.toLowerCase().includes(q));
  }, [options, linkedPinIds, query]);

  async function handleLink(pinId: string) {
    setLinkingId(pinId);
    const result = await linkPinToPage({ pinId, pageId });
    setLinkingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onLinked();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-pin-title"
        className="relative flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-gray-200 p-4">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <input
            id="link-pin-title"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("map.searchPins")}
            className="min-w-0 flex-1 border-none p-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {loading && (
            <p className="py-4 text-center text-sm text-gray-500">
              {t("buttons.loading")}
            </p>
          )}
          {error && (
            <p className="px-1 text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && options.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              {t("map.noMapYet")}
            </p>
          )}
          {!loading && options.length > 0 && filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              {t("map.noPinsFound")}
            </p>
          )}
          {!loading &&
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={linkingId === option.id}
                onClick={() => void handleLink(option.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent-50 disabled:opacity-50"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${PIN_TYPE_STYLES[option.type].dot}`}
                  aria-hidden
                />
                <span className="truncate text-gray-800">{option.label}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
