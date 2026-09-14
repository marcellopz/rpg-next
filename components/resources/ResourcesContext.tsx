"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useOptionalDemoSandbox } from "@/components/campaigns/DemoSandboxProvider";
import { isDemoCampaignId } from "@/data/demo-campaign";
import { useOptimisticData } from "@/hooks/useOptimisticData";
import { fetchResourcesClient } from "@/lib/resources/client-state";
import type { ResourcesDashboard } from "@/lib/resources/types";
import { createClient } from "@/lib/supabase/client";

type ResourcesContextValue = {
  dashboard: ResourcesDashboard;
  campaignId: string;
  readOnly: boolean;
  localOnly: boolean;
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
  const sandbox = useOptionalDemoSandbox();
  const isDemo = isDemoCampaignId(campaignId);
  const localOnly = !!sandbox || isDemo;
  const locked = !!readOnly && !localOnly;

  const { data, run, reconcile } = useOptimisticData<ResourcesDashboard>(
    serverDashboard,
    {
      refetch: locked || localOnly
        ? undefined
        : () => fetchResourcesClient(campaignId),
      localOnly,
      disabled: locked,
    }
  );

  useEffect(() => {
    sandbox?.setResources(data);
  }, [sandbox, data]);

  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;

  // Other members' changes arrive here. Our own writes are already applied
  // locally, and reconcile() is a no-op while a mutation is in flight, so the
  // self-echo costs at most one cheap re-read instead of a full page render.
  useEffect(() => {
    if (locked || localOnly) return;
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
  }, [campaignId, locked, localOnly]);

  const value = useMemo(
    () => ({
      dashboard: data,
      campaignId,
      readOnly: locked,
      localOnly,
      run,
      reconcile,
    }),
    [data, campaignId, locked, localOnly, run, reconcile]
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
