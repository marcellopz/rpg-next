"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type FileVisibility = "public" | "private";

const BUCKETS: Record<FileVisibility, "public-assets" | "private-files"> = {
  public: "public-assets",
  private: "private-files",
};

export type UploadedFile = {
  bucket: "public-assets" | "private-files";
  path: string;
  filename: string;
  contentType: string | null;
  sizeBytes: number;
  /** Public URL for public uploads. Null for private files (use a signed URL later). */
  publicUrl: string | null;
};

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (é -> e, ç -> c, ...)
    .replace(/[^a-zA-Z0-9._-]+/g, "-") // only safe ASCII chars survive as storage keys
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function buildObjectPath(
  campaignId: string,
  filename: string,
  folder?: string
): string {
  const safeName = sanitizeFilename(filename) || "file";
  const unique = `${crypto.randomUUID()}-${safeName}`;
  const parts = [campaignId];
  if (folder?.trim()) {
    parts.push(
      folder
        .trim()
        .replace(/^\/+|\/+$/g, "")
        .replace(/[/\\]+/g, "/")
    );
  }
  parts.push(unique);
  return parts.join("/");
}

/**
 * Upload a file to Supabase Storage.
 * - `public` → `public-assets` bucket + public URL
 * - `private` → `private-files` bucket (no usable public URL)
 */
export function useFileUpload(visibility: FileVisibility) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bucket = BUCKETS[visibility];

  const reset = useCallback(() => {
    setError(null);
    setUploading(false);
  }, []);

  const upload = useCallback(
    async (
      file: File,
      options: {
        campaignId: string;
        /** Optional subfolder under the campaign, e.g. "portraits" or "handouts". */
        folder?: string;
      }
    ): Promise<UploadedFile | null> => {
      setUploading(true);
      setError(null);

      try {
        if (!options.campaignId) {
          throw new Error("Campaign id is required.");
        }
        if (!file || file.size <= 0) {
          throw new Error("Choose a non-empty file to upload.");
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("You must be signed in to upload files.");
        }

        const path = buildObjectPath(
          options.campaignId,
          file.name,
          options.folder
        );

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        let publicUrl: string | null = null;
        if (visibility === "public") {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path);
          publicUrl = data.publicUrl;
        }

        return {
          bucket,
          path,
          filename: file.name,
          contentType: file.type || null,
          sizeBytes: file.size,
          publicUrl,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Try again.";
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [bucket, visibility]
  );

  return {
    visibility,
    bucket,
    uploading,
    error,
    upload,
    reset,
  };
}
