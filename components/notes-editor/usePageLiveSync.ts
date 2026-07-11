"use client";

import { useEffect, useRef } from "react";
import type { JSONContent } from "@tiptap/core";
import { getPageLiveState } from "@/app/actions/pages";
import { createClient } from "@/lib/supabase/client";

export type RemotePageUpdate = {
  contentJson: JSONContent | null;
  updatedAt: string;
  lastSavedByName: string;
};

/** Subscribe to page UPDATEs and fetch live content when a peer saves. */
export function usePageLiveSync({
  pageId,
  enabled,
  getIgnoreUpdatedAt,
  onRemoteUpdate,
}: {
  pageId: string;
  enabled?: boolean;
  /** Return the updatedAt of the caller's own last save to ignore echo. */
  getIgnoreUpdatedAt: () => string | null;
  onRemoteUpdate: (update: RemotePageUpdate) => void;
}) {
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  const getIgnoreUpdatedAtRef = useRef(getIgnoreUpdatedAt);
  onRemoteUpdateRef.current = onRemoteUpdate;
  getIgnoreUpdatedAtRef.current = getIgnoreUpdatedAt;

  useEffect(() => {
    if (enabled === false) return;

    const supabase = createClient();
    let cancelled = false;
    let fetchInFlight = false;

    async function pull() {
      if (fetchInFlight || cancelled) return;
      fetchInFlight = true;
      try {
        const result = await getPageLiveState(pageId);
        if (cancelled || !result.ok) return;

        const ignoreAt = getIgnoreUpdatedAtRef.current();
        if (ignoreAt && result.data.updatedAt === ignoreAt) return;

        onRemoteUpdateRef.current(result.data);
      } finally {
        fetchInFlight = false;
      }
    }

    const channel = supabase
      .channel(`notes-live:${pageId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pages",
          filter: `id=eq.${pageId}`,
        },
        (payload) => {
          const row = payload.new as { updated_at?: string } | null;
          const ignoreAt = getIgnoreUpdatedAtRef.current();
          if (row?.updated_at && ignoreAt && row.updated_at === ignoreAt) {
            return;
          }
          void pull();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [pageId, enabled]);
}
