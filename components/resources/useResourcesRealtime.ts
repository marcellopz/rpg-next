"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isDemoCampaignId } from "@/data/demo-campaign";
import { createClient } from "@/lib/supabase/client";

const CARD_TABLE = "resource_cards";
const ITEM_TABLE = "resource_items";
const LAYOUT_TABLE = "resource_dashboard_layouts";

export function useResourcesRealtime(campaignId: string) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDemoCampaignId(campaignId)) return;
    const supabase = createClient();

    function scheduleRefresh() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => router.refresh(), 200);
    }

    const channel = supabase
      .channel(`resources:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: CARD_TABLE,
          filter: `campaign_id=eq.${campaignId}`,
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: ITEM_TABLE,
          filter: `campaign_id=eq.${campaignId}`,
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: LAYOUT_TABLE,
          filter: `campaign_id=eq.${campaignId}`,
        },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [campaignId, router]);
}
