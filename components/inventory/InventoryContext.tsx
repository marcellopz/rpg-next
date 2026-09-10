"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isDemoCampaignId } from "@/data/demo-campaign";
import { useOptionalDemoSandbox } from "@/components/campaigns/DemoSandboxProvider";
import { useOptimisticData } from "@/hooks/useOptimisticData";
import { fetchInventoryCharactersClient } from "@/lib/inventory/client-state";
import type { Character } from "@/lib/queries/inventory";
import { createClient } from "@/lib/supabase/client";

type InventoryContextValue = {
  characters: Character[];
  campaignId: string;
  readOnly: boolean;
  run: ReturnType<typeof useOptimisticData<Character[]>>["run"];
  reconcile: () => Promise<void>;
  /** Bumped whenever a realtime change lands, so the log panel can re-read. */
  changeToken: number;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

const TABLES = ["characters", "inventory_items", "inventory_log_entries"];

export function InventoryProvider({
  campaignId,
  characters: serverCharacters,
  readOnly,
  children,
}: {
  campaignId: string;
  characters: Character[];
  readOnly?: boolean;
  children: ReactNode;
}) {
  const sandbox = useOptionalDemoSandbox();
  const localOnly = !!sandbox || isDemoCampaignId(campaignId);
  const locked = !!readOnly && !localOnly;

  const { data, run, reconcile } = useOptimisticData<Character[]>(
    serverCharacters,
    {
      refetch: locked || localOnly
        ? undefined
        : () => fetchInventoryCharactersClient(campaignId),
      localOnly,
      disabled: locked,
    }
  );

  useEffect(() => {
    sandbox?.setCharacters(data);
  }, [sandbox, data]);

  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;

  // A counter the log panel watches so it can re-read on change. Keeping the
  // log out of the optimistic state means an item edit doesn't pull 100 log
  // rows with their JSON snapshots.
  const [changeToken, setChangeToken] = useState(0);
  const bumpChangeToken = useCallback(
    () => setChangeToken((n) => n + 1),
    []
  );
  const bumpRef = useRef(bumpChangeToken);
  bumpRef.current = bumpChangeToken;

  // Other members' changes arrive here. Our own writes are already applied
  // locally, and reconcile() is a no-op while a mutation is in flight, so the
  // self-echo costs at most one cheap re-read instead of a full page render.
  useEffect(() => {
    if (locked || localOnly) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleReconcile() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void reconcileRef.current();
        bumpRef.current();
      }, 200);
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
      characters: data,
      campaignId,
      readOnly: !!readOnly,
      run,
      reconcile,
      changeToken,
    }),
    [data, campaignId, readOnly, run, reconcile, changeToken]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return ctx;
}
