"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { isDemoCampaignId } from "@/data/demo-campaign";
import { useOptimisticData } from "@/hooks/useOptimisticData";
import { fetchResourcesClient } from "@/lib/resources/client-state";
import type { ResourcesDashboard } from "@/lib/resources/types";
import { createClient } from "@/lib/supabase/client";

type ResourcesContextValue = {
  dashboard: ResourcesDashboard;
  campaignId: string;
  readOnly: boolean;
  run: ReturnType<typeof useOptimisticData<ResourcesDashboard>>["run"];
  reconcile: () => Promise<void>;
};

const ResourcesContext = createContext<ResourcesContextValue | null>(null);

const TABLES = [
  "resource_cards",
  "resource_items",
  "resource_dashboard_layouts",
];

export function ResourcesProvider({
  campaignId,
  dashboard: serverDashboard,
  readOnly,
  children,
}: {
  campaignId: string;
  dashboard: ResourcesDashboard;
  readOnly?: boolean;
  children: ReactNode;
}) {
  const isDemo = isDemoCampaignId(campaignId);
  const disabled = !!readOnly || isDemo;

  const { data, run, reconcile } = useOptimisticData<ResourcesDashboard>(
    serverDashboard,
    {
      refetch: disabled
        ? undefined
        : () => fetchResourcesClient(campaignId),
      disabled,
    }
  );

  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;

  // Other members' changes arrive here. Our own writes are already applied
  // locally, and reconcile() is a no-op while a mutation is in flight, so the
  // self-echo costs at most one cheap re-read instead of a full page render.
  useEffect(() => {
    if (disabled) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleReconcile() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void reconcileRef.current(), 200);
    }

    let channel = supabase.channel(`resources:${campaignId}`);
    for (const table of TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `campaign_id=eq.${campaignId}`,
        },
        scheduleReconcile
      );
    }
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [campaignId, disabled]);

  const value = useMemo(
    () => ({
      dashboard: data,
      campaignId,
      readOnly: disabled,
      run,
      reconcile,
    }),
    [data, campaignId, disabled, run, reconcile]
  );

  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
}

export function useResources() {
  const ctx = useContext(ResourcesContext);
  if (!ctx) {
    throw new Error("useResources must be used within a ResourcesProvider");
  }
  return ctx;
}
