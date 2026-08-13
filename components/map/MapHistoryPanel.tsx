"use client";

import { useEffect, useState } from "react";
import { listMapPinLog, type MapPinLogEntry } from "@/app/actions/maps";
import { useI18n } from "@/lib/i18n/context";
import { relativeTime } from "@/lib/users/relative-time";
import { Button, Typography } from "@/components/ui";

export function MapHistoryPanel({
  mapId,
  onClose,
}: {
  mapId: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<MapPinLogEntry[]>([]);
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
      const result = await listMapPinLog(mapId);
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
  }, [mapId]);

  return (
    <div
      id="map-history-modal"
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
        aria-labelledby="map-history-title"
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <Typography variant="h3" as="h2" id="map-history-title">
              {t("map.historyTitle")}
            </Typography>
            <Typography variant="small" className="mt-0.5">
              {t("map.historySubtitle")}
            </Typography>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {t("buttons.close")}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <Typography variant="muted">{t("buttons.loading")}</Typography>
          )}
          {error && (
            <Typography variant="small" className="text-red-600">
              {error}
            </Typography>
          )}
          {!loading && !error && entries.length === 0 && (
            <Typography variant="muted">{t("map.historyEmpty")}</Typography>
          )}

          <ol className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
              >
                <p className="text-sm font-medium text-gray-800">
                  {t(`map.historyAction.${entry.action}`, {
                    label: entry.pinLabel,
                  })}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {entry.actorName} · {relativeTime(entry.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
