"use client";

import { FileUp, History, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { HandoutVisibility } from "@/lib/files/types";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { Button, Typography } from "@/components/ui";
import { HandoutsFileCard } from "./HandoutsFileCard";
import { HandoutsHistoryPanel } from "./HandoutsHistoryPanel";
import { HandoutsUploadDialog } from "./HandoutsUploadDialog";
import { useCampaignHandouts } from "./useCampaignHandouts";

export function HandoutsTool({
  campaignId,
  isAdmin,
  readOnly,
}: {
  campaignId: string;
  isAdmin: boolean;
  readOnly?: boolean;
}) {
  const { t } = useI18n();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const {
    files,
    allCount,
    loading,
    error,
    filter,
    setFilter,
    refresh,
    removeFileLocally,
  } =
    useCampaignHandouts(campaignId);

  const VISIBILITY_FILTERS: { id: "all" | HandoutVisibility; label: string }[] = [
    { id: "all", label: t("handouts.filter.all") },
    { id: "public", label: t("handouts.filter.shared") },
    { id: "private", label: t("handouts.filter.personal") },
  ];

  const KIND_FILTERS = [
    { id: "all" as const, label: t("handouts.filter.all") },
    { id: "images" as const, label: t("handouts.filter.images") },
    { id: "pdfs" as const, label: t("handouts.filter.pdfs") },
    { id: "other" as const, label: "Other" },
  ];

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  function canDeleteFile(uploaderId: string, visibility: HandoutVisibility) {
    if (readOnly || !userId) return false;
    if (uploaderId === userId) return true;
    return isAdmin && visibility === "public";
  }

  return (
    <div id="handouts-tool" className="flex min-h-[42rem] flex-col">
      <div
        id="handouts-toolbar"
        className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-white p-1 shadow-sm ring-1 ring-inset ring-gray-200">
            {VISIBILITY_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setFilter((prev) => ({ ...prev, visibility: item.id }))
                }
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  filter.visibility === item.id
                    ? "bg-accent-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg bg-white p-1 shadow-sm ring-1 ring-inset ring-gray-200">
            {KIND_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setFilter((prev) => ({ ...prev, kind: item.id }))
                }
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  filter.kind === item.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="mr-1.5 h-4 w-4" aria-hidden />
              {t("handouts.history")}
            </Button>
          )}
          {!readOnly && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-1.5 h-4 w-4" aria-hidden />
              {t("handouts.upload")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="flex min-h-[32rem] items-center justify-center">
            <Typography variant="muted">{t("buttons.loading")}</Typography>
          </div>
        ) : error ? (
          <div className="flex min-h-[32rem] flex-col items-center justify-center text-center">
            <Typography variant="h3" as="h2">
              Couldn’t load files
            </Typography>
            <Typography variant="muted" className="mt-2 max-w-sm leading-6">
              {error}
            </Typography>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => void refresh()}
            >
              Try again
            </Button>
          </div>
        ) : allCount === 0 ? (
          <div className="flex min-h-[32rem] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-700">
              <FileUp className="h-5 w-5" aria-hidden />
            </div>
            <Typography variant="h3" as="h2">
              {t("handouts.noFiles")}
            </Typography>
            <Typography variant="muted" className="mt-2 max-w-sm leading-6">
              Choose shared for the whole table, or personal for files only you
              can see. Shared images can be shown to everyone as a popup.
            </Typography>
            {!readOnly && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-6"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="mr-1.5 h-4 w-4" aria-hidden />
                {t("handouts.upload")}
              </Button>
            )}
          </div>
        ) : files.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center text-center">
            <Typography variant="h3" as="h2">
              No matching files
            </Typography>
            <Typography variant="muted" className="mt-2">
              Try a different filter or upload something new.
            </Typography>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((file) => (
              <HandoutsFileCard
                key={file.id}
                file={file}
                campaignId={campaignId}
                canDelete={canDeleteFile(file.uploaderId, file.visibility)}
                readOnly={readOnly}
                onDeleted={() => {
                  // Row disappears immediately; the re-read confirms in the
                  // background and reconciles anything else that changed.
                  removeFileLocally(file.id);
                  void refresh({ background: true });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <HandoutsUploadDialog
          open={uploadOpen}
          campaignId={campaignId}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => void refresh({ background: true })}
        />
      )}
      {historyOpen && (
        <HandoutsHistoryPanel
          campaignId={campaignId}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
