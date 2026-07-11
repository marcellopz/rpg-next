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
import {
  clearHandoutBroadcast,
  showHandoutToTable,
} from "@/app/actions/files";
import type { ActionResult } from "@/app/actions/campaigns";
import { fetchHandoutBroadcastClient } from "@/lib/files/client-state";
import type { HandoutBroadcast } from "@/lib/files/types";
import { createClient } from "@/lib/supabase/client";

type HandoutBroadcastContextValue = {
  broadcast: HandoutBroadcast | null;
  showToTable: (fileId: string) => Promise<ActionResult<HandoutBroadcast>>;
  clearForEveryone: () => Promise<ActionResult<HandoutBroadcast>>;
  dismissLocally: () => void;
  dismissedKey: string | null;
  broadcastKey: string | null;
};

const HandoutBroadcastContext =
  createContext<HandoutBroadcastContextValue | null>(null);

function broadcastKeyOf(broadcast: HandoutBroadcast | null): string | null {
  if (!broadcast?.fileId || !broadcast.updatedAt) return null;
  return `${broadcast.fileId}:${broadcast.updatedAt}`;
}

export function HandoutBroadcastProvider({
  campaignId,
  children,
}: {
  campaignId: string;
  children: ReactNode;
}) {
  const [broadcast, setBroadcast] = useState<HandoutBroadcast | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const applyBroadcast = useCallback((next: HandoutBroadcast | null) => {
    setBroadcast(next);
    // A new share should always reopen, even if the user previously dismissed.
    if (next?.fileId) {
      setDismissedKey((prev) => {
        const key = broadcastKeyOf(next);
        return prev === key ? prev : null;
      });
    } else {
      setDismissedKey(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchHandoutBroadcastClient(campaignId);
      applyBroadcast(next);
    } catch {
      // Keep last known broadcast if refresh fails.
    }
  }, [applyBroadcast, campaignId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const channel = supabase.channel(`handout-live:${campaignId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on("broadcast", { event: "handout" }, ({ payload }) => {
        if (!active) return;
        applyBroadcast(
          (payload as { broadcast?: HandoutBroadcast | null }).broadcast ?? null
        );
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_handout_broadcasts",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          if (!active) return;
          void refresh();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channelRef.current = channel;
        }
      });

    return () => {
      active = false;
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [applyBroadcast, campaignId, refresh]);

  const publish = useCallback(
    async (next: HandoutBroadcast | null) => {
      // Always update local state immediately (covers the clicker).
      applyBroadcast(next);

      const channel = channelRef.current;
      if (!channel) return;

      const result = await channel.send({
        type: "broadcast",
        event: "handout",
        payload: { broadcast: next },
      });

      // If broadcast couldn't send yet, fall back to a DB refetch for peers.
      if (result !== "ok") {
        void refresh();
      }
    },
    [applyBroadcast, refresh]
  );

  const showToTable = useCallback(
    async (fileId: string) => {
      const result = await showHandoutToTable({ campaignId, fileId });
      if (result.ok) {
        await publish(result.data);
      }
      return result;
    },
    [campaignId, publish]
  );

  const clearForEveryone = useCallback(async () => {
    const result = await clearHandoutBroadcast(campaignId);
    if (result.ok) {
      await publish(result.data);
    }
    return result;
  }, [campaignId, publish]);

  const dismissLocally = useCallback(() => {
    const key = broadcastKeyOf(broadcast);
    if (key) setDismissedKey(key);
  }, [broadcast]);

  const value = useMemo(
    () => ({
      broadcast,
      showToTable,
      clearForEveryone,
      dismissLocally,
      dismissedKey,
      broadcastKey: broadcastKeyOf(broadcast),
    }),
    [
      broadcast,
      showToTable,
      clearForEveryone,
      dismissLocally,
      dismissedKey,
    ]
  );

  return (
    <HandoutBroadcastContext.Provider value={value}>
      {children}
    </HandoutBroadcastContext.Provider>
  );
}

export function useHandoutBroadcast() {
  const ctx = useContext(HandoutBroadcastContext);
  if (!ctx) {
    throw new Error(
      "useHandoutBroadcast must be used within HandoutBroadcastProvider"
    );
  }
  return ctx;
}
