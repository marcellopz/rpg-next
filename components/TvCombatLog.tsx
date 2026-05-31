"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  message: string;
  kind: string;
  created_at: string;
};

// Read-only live combat log for the TV. Reuses the same Supabase realtime
// subscription as the interactive log — WebSockets work on Chromium 38+ — but
// shows no input controls and performs no mutations.
export function TvCombatLog({ campaignId }: { campaignId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("combat_log_entries")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setEntries((data as Entry[]) ?? []));

    const channel = supabase
      .channel(`tv-combat-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "combat_log_entries",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => setEntries((prev) => [...prev, payload.new as Entry])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div className="tv-row">
      {entries.map((e) => (
        <div key={e.id} className="tv-entry">
          <span className="tv-kind">{e.kind}</span>
          {e.message}
        </div>
      ))}
      {entries.length === 0 && <p>Waiting for combat…</p>}
    </div>
  );
}
