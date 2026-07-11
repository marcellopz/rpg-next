"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PagePresencePeer = {
  userId: string;
  displayName: string;
};

type PresenceMeta = {
  userId?: string;
  displayName?: string;
};

function peersFromState(
  state: Record<string, PresenceMeta[]>,
  selfId: string | null
): PagePresencePeer[] {
  const byUser = new Map<string, string>();
  for (const metas of Object.values(state)) {
    for (const meta of metas) {
      if (!meta.userId || meta.userId === selfId) continue;
      byUser.set(meta.userId, meta.displayName?.trim() || "Someone");
    }
  }
  return Array.from(byUser.entries()).map(([userId, displayName]) => ({
    userId,
    displayName,
  }));
}

/** Ephemeral presence for everyone currently viewing a note page. */
export function usePagePresence(pageId: string): PagePresencePeer[] {
  const [others, setOthers] = useState<PagePresencePeer[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function join() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const displayName =
        (user.user_metadata?.display_name as string | undefined)?.trim() ||
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email ||
        "Someone";

      channel = supabase.channel(`notes-presence:${pageId}`, {
        config: { presence: { key: user.id } },
      });

      const sync = () => {
        if (!channel) return;
        setOthers(peersFromState(channel.presenceState<PresenceMeta>(), user.id));
      };

      channel
        .on("presence", { event: "sync" }, sync)
        .on("presence", { event: "join" }, sync)
        .on("presence", { event: "leave" }, sync)
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED" || !channel) return;
          await channel.track({ userId: user.id, displayName });
        });
    }

    void join();

    return () => {
      cancelled = true;
      if (channel) {
        void channel.untrack();
        void supabase.removeChannel(channel);
      }
      setOthers([]);
    };
  }, [pageId]);

  return others;
}

export function formatPresenceLabel(peers: PagePresencePeer[]): string | null {
  if (peers.length === 0) return null;
  if (peers.length === 1) return `${peers[0].displayName} is editing`;
  if (peers.length === 2) {
    return `${peers[0].displayName} and ${peers[1].displayName} are editing`;
  }
  return `${peers[0].displayName} and ${peers.length - 1} others are editing`;
}
