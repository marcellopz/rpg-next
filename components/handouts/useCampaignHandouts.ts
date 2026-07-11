"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchFilesForCampaignClient } from "@/lib/files/client-state";
import type {
  CampaignFileRow,
  HandoutVisibility,
} from "@/lib/files/types";

type ListFilter = {
  visibility: "all" | HandoutVisibility;
  kind: "all" | "images" | "pdfs" | "other";
};

function matchesKind(file: CampaignFileRow, kind: ListFilter["kind"]): boolean {
  if (kind === "all") return true;
  const type = file.contentType ?? "";
  if (kind === "images") return type.startsWith("image/");
  if (kind === "pdfs") return type === "application/pdf";
  return !type.startsWith("image/") && type !== "application/pdf";
}

export function useCampaignHandouts(campaignId: string) {
  const [files, setFiles] = useState<CampaignFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListFilter>({
    visibility: "all",
    kind: "all",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchFilesForCampaignClient(campaignId);
      setFiles(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load files.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`handouts:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "files",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignId, refresh]);

  const filtered = files.filter((file) => {
    if (filter.visibility !== "all" && file.visibility !== filter.visibility) {
      return false;
    }
    return matchesKind(file, filter.kind);
  });

  return {
    files: filtered,
    allCount: files.length,
    loading,
    error,
    filter,
    setFilter,
    refresh,
  };
}
