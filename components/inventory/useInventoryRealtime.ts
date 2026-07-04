"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABLES = ["characters", "inventory_items", "inventory_log_entries"];

// Live-refresh the inventory view when anyone changes it: subscribe to
// database change events for this campaign and re-render the server page.
// Events are RLS-filtered per subscriber (is_member), so non-members get
// nothing. A short debounce coalesces bursts (e.g. a drag-reorder writes one
// row per item).
export function useInventoryRealtime(campaignId: string) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    function scheduleRefresh() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => router.refresh(), 200);
    }

    let channel = supabase.channel(`inventory:${campaignId}`);
    for (const table of TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `campaign_id=eq.${campaignId}`,
        },
        scheduleRefresh
      );
    }
    channel.subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [campaignId, router]);
}
