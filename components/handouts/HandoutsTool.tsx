"use client";

import { FileUp, History, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { HandoutVisibility } from "@/lib/files/types";
import { createClient } from "@/lib/supabase/client";
import { Button, Typography } from "@/components/ui";
import { HandoutsFileCard } from "./HandoutsFileCard";
import { HandoutsHistoryPanel } from "./HandoutsHistoryPanel";
import { HandoutsUploadDialog } from "./HandoutsUploadDialog";
import { useCampaignHandouts } from "./useCampaignHandouts";

const VISIBILITY_FILTERS: { id: "all" | HandoutVisibility; label: string }[] = [
  { id: "all", label: "All" },
  { id: "public", label: "Shared" },
  { id: "private", label: "Personal" },
];

const KIND_FILTERS = [
  { id: "all" as const, label: "All types" },
  { id: "images" as const, label: "Images" },
  { id: "pdfs" as const, label: "PDFs" },
  { id: "other" as const, label: "Other" },
];

export function HandoutsTool({
  campaignId,
  isAdmin,
}: {
  campaignId: string;
  isAdmin: boolean;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { files, allCount, loading, error, filter, setFilter, refresh } =
    useCampaignHandouts(campaignId);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  function canDeleteFile(uploaderId: string, visibility: HandoutVisibility) {
    if (!userId) return false;
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="mr-1.5 h-4 w-4" aria-hidden />
            History
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="mr-1.5 h-4 w-4" aria-hidden />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6">
        {loading ? (
          <div className="flex min-h-[32rem] items-center justify-center">
            <Typography variant="muted">Loading files…</Typography>
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
              No handouts yet
            </Typography>
            <Typography variant="muted" className="mt-2 max-w-sm leading-6">
              Choose shared for the whole table, or personal for files only you
              can see. Shared images can be shown to everyone as a popup.
            </Typography>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-6"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-1.5 h-4 w-4" aria-hidden />
              Upload first file
            </Button>
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
                onDeleted={() => void refresh()}
              />
            ))}
          </div>
        )}
      </div>

      <HandoutsUploadDialog
        open={uploadOpen}
        campaignId={campaignId}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => void refresh()}
      />
      {historyOpen && (
        <HandoutsHistoryPanel
          campaignId={campaignId}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
