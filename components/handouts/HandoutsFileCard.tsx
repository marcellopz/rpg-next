"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  File,
  FileText,
  Image as ImageIcon,
  Presentation,
  Trash2,
} from "lucide-react";
import {
  deleteCampaignFile,
  getPrivateHandoutUrl,
} from "@/app/actions/files";
import {
  formatBytes,
  isImageContentType,
  isPdfContentType,
  type CampaignFileRow,
} from "@/lib/files/types";
import { Button, Chip, Typography } from "@/components/ui";
import { useHandoutBroadcast } from "./HandoutBroadcastContext";

export function HandoutsFileCard({
  file,
  campaignId,
  canDelete,
  onDeleted,
}: {
  file: CampaignFileRow;
  campaignId: string;
  canDelete: boolean;
  onDeleted?: () => void;
}) {
  const { showToTable } = useHandoutBroadcast();
  const [opening, setOpening] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isImage = isImageContentType(file.contentType);
  const isPdf = isPdfContentType(file.contentType);
  const isShared = file.visibility === "public";

  async function resolveUrl(): Promise<string | null> {
    if (isShared && file.publicUrl) {
      return file.publicUrl;
    }
    const result = await getPrivateHandoutUrl({
      campaignId,
      path: file.path,
    });
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    return result.data.url;
  }

  async function handleOpen() {
    setOpening(true);
    setError(null);
    const url = await resolveUrl();
    setOpening(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleShowToTable() {
    setSharing(true);
    setError(null);
    const result = await showToTable(file.id);
    setSharing(false);
    if (!result.ok) setError(result.error);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${file.filename}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    const result = await deleteCampaignFile({
      campaignId,
      fileId: file.id,
    });
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDeleted?.();
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative flex h-36 items-center justify-center bg-gray-50">
        {isImage && file.publicUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.publicUrl}
            alt={file.filename}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            {isImage ? (
              <ImageIcon className="h-10 w-10" aria-hidden />
            ) : isPdf ? (
              <FileText className="h-10 w-10" aria-hidden />
            ) : (
              <File className="h-10 w-10" aria-hidden />
            )}
            <span className="text-xs font-medium uppercase tracking-wide">
              {isPdf ? "PDF" : isImage ? "Image" : "File"}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Typography
            variant="body"
            as="h3"
            className="truncate font-semibold text-gray-900"
            title={file.filename}
          >
            {file.filename}
          </Typography>
          <Typography variant="small" className="mt-1">
            {formatBytes(file.sizeBytes)}
            {file.createdAt
              ? ` · ${new Date(file.createdAt).toLocaleDateString()}`
              : ""}
          </Typography>
        </div>

        <div className="flex items-center gap-2">
          <Chip variant={isShared ? "accent" : "neutral"}>
            {isShared ? (
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3 w-3" aria-hidden />
                Shared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <EyeOff className="h-3 w-3" aria-hidden />
                Personal
              </span>
            )}
          </Chip>
        </div>

        {error && (
          <Typography variant="small" className="text-red-600">
            {error}
          </Typography>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={opening}
            onClick={() => void handleOpen()}
          >
            {opening ? "Opening…" : isImage || isPdf ? "Open" : "Download"}
          </Button>
          {isShared && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={sharing}
              onClick={() => void handleShowToTable()}
            >
              <Presentation className="mr-1.5 h-4 w-4" aria-hidden />
              {sharing ? "Sharing…" : "Show to table"}
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="dangerOutline"
              size="sm"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
