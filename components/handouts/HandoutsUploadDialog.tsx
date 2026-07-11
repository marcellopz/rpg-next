"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Upload } from "lucide-react";
import { registerCampaignFile } from "@/app/actions/files";
import {
  useFileUpload,
  type FileVisibility,
} from "@/hooks/useFileUpload";
import { Button, Typography } from "@/components/ui";

export function HandoutsUploadDialog({
  open,
  campaignId,
  onClose,
  onUploaded,
}: {
  open: boolean;
  campaignId: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [visibility, setVisibility] = useState<FileVisibility>("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error, reset } = useFileUpload(visibility);

  if (!open) return null;

  function handleClose() {
    setSelectedFile(null);
    setFormError(null);
    reset();
    onClose();
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setPending(true);
    setFormError(null);

    const result = await upload(selectedFile, {
      campaignId,
      folder: "handouts",
    });
    if (!result) {
      setPending(false);
      return;
    }

    const registered = await registerCampaignFile({
      campaignId,
      path: result.path,
      filename: result.filename,
      contentType: result.contentType,
      sizeBytes: result.sizeBytes,
      visibility,
    });
    setPending(false);

    if (!registered.ok) {
      setFormError(registered.error);
      return;
    }

    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    onUploaded();
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="handouts-upload-title"
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h3" as="h2" id="handouts-upload-title">
          Upload handout
        </Typography>
        <Typography variant="muted" className="mt-1">
          Maps, images, and PDFs for the table.
        </Typography>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Visibility</p>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                  visibility === "public"
                    ? "border-accent-500 bg-accent-50 text-accent-800"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  className="sr-only"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                />
                Shared
                <span className="mt-0.5 block text-xs text-gray-500">
                  Visible to the whole campaign
                </span>
              </label>
              <label
                className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                  visibility === "private"
                    ? "border-accent-500 bg-accent-50 text-accent-800"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  className="sr-only"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                />
                Personal
                <span className="mt-0.5 block text-xs text-gray-500">
                  Only you can see this file
                </span>
              </label>
            </div>
          </div>

          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf,.pdf"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              onChange={onFileChange}
            />
            {selectedFile && (
              <Typography variant="small" className="mt-2">
                Selected: {selectedFile.name}
              </Typography>
            )}
          </div>

          {(error || formError) && (
            <Typography variant="small" className="text-red-600">
              {formError ?? error}
            </Typography>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedFile || uploading || pending}
            >
              <Upload className="mr-1.5 h-4 w-4" aria-hidden />
              {uploading || pending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
