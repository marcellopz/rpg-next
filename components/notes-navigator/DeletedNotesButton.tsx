"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  listDeletedPages,
  restoreDeletedPage,
  type DeletedPageSummary,
} from "@/app/actions/pages";
import type { NoteScope } from "@/app/actions/categories";
import { useOptionalDemoSandbox } from "@/components/campaigns/DemoSandboxProvider";
import { Button, Typography } from "@/components/ui";
import { isDemoCampaignId } from "@/data/demo-campaign";
import { useI18n } from "@/lib/i18n/context";

export function DeletedNotesButton({
  campaignId,
  scope,
  onRestored,
}: {
  campaignId: string;
  scope: NoteScope;
  onRestored: (page: DeletedPageSummary) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const sandbox = useOptionalDemoSandbox();
  const localOnly = isDemoCampaignId(campaignId);
  const localItems = localOnly
    ? (sandbox?.archivedPages ?? [])
        .filter((page) => page.scope === scope)
        .map(
          (page): DeletedPageSummary => ({
            id: page.id,
            title: page.title,
            categoryId: page.categoryId,
            categoryName: page.categoryName,
            deletedAt: page.deletedAt,
          })
        )
    : undefined;

  return (
    <>
      <button
        type="button"
        id="notes-deleted-open"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-left text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("notes.deletedNotes")}
      </button>
      {open && (
        <DeletedNotesModal
          campaignId={campaignId}
          scope={scope}
          localItems={localItems}
          onClose={() => setOpen(false)}
          onRestored={(page) => {
            setOpen(false);
            onRestored(page);
          }}
        />
      )}
    </>
  );
}

function DeletedNotesModal({
  campaignId,
  scope,
  localItems,
  onClose,
  onRestored,
}: {
  campaignId: string;
  scope: NoteScope;
  localItems?: DeletedPageSummary[];
  onClose: () => void;
  onRestored: (page: DeletedPageSummary) => void;
}) {
  const { locale, t } = useI18n();
  const remote = localItems === undefined;
  const [pages, setPages] = useState<DeletedPageSummary[]>([]);
  const [loading, setLoading] = useState(remote);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";
  const shown = localItems ?? pages;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!remote) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await listDeletedPages({ campaignId, scope });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setPages([]);
      } else {
        setPages(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, scope, remote]);

  async function restore(page: DeletedPageSummary) {
    if (pendingId) return;
    setError(null);
    if (localItems) {
      onRestored(page);
      return;
    }
    setPendingId(page.id);
    const result = await restoreDeletedPage(page.id);
    setPendingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onRestored({ ...page, categoryId: result.data.categoryId });
  }

  return (
    <div
      id="notes-deleted-modal"
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
        aria-labelledby="notes-deleted-title"
        className="relative flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div>
            <Typography variant="h3" as="h2" id="notes-deleted-title">
              {t("notes.deletedNotes")}
            </Typography>
            <Typography variant="small" className="mt-0.5">
              {t("notes.deletedNotesHint")}
            </Typography>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {t("buttons.close")}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && (
            <Typography variant="muted">
              {t("notes.deletedNotesLoading")}
            </Typography>
          )}
          {error && (
            <Typography variant="small" className="mb-3 text-red-600">
              {error}
            </Typography>
          )}
          {!loading && shown.length === 0 && (
            <Typography variant="muted">{t("notes.deletedNotesEmpty")}</Typography>
          )}

          <ul className="space-y-2">
            {shown.map((page) => {
              const deletedAt = new Date(page.deletedAt).toLocaleString(
                dateLocale,
                { dateStyle: "medium", timeStyle: "short" }
              );
              return (
                <li
                  key={page.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {page.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {page.categoryName ?? t("notes.uncategorized")}
                      {" · "}
                      {t("notes.deletedOn", { date: deletedAt })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    disabled={pendingId === page.id}
                    onClick={() => void restore(page)}
                  >
                    {pendingId === page.id
                      ? t("notes.restoring")
                      : t("notes.restore")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
