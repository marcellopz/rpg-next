"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  message: string;
  kind: string;
  author_id: string;
  created_at: string;
};

export function CombatLog({ campaignId }: { campaignId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // 1. Load existing entries
    supabase
      .from("combat_log_entries")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setEntries((data as Entry[]) ?? []));

    // 2. Subscribe to new ones — realtime
    const channel = supabase
      .channel(`combat-log-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "combat_log_entries",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          setEntries((prev) => [...prev, payload.new as Entry]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function addEntry(kind = "note") {
    if (!draft.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("combat_log_entries").insert({
      campaign_id: campaignId,
      author_id: user.id,
      message: draft.trim(),
      kind,
    });
    setDraft("");
  }

  return (
    <div className="space-y-3">
      <div className="max-h-80 space-y-1 overflow-y-auto rounded border border-gray-800 p-3">
        {entries.map((e) => (
          <div key={e.id} className="text-sm">
            <span className="mr-2 text-xs uppercase opacity-60">{e.kind}</span>
            {e.message}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-sm text-gray-500">No combat log entries yet.</div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEntry()}
          placeholder="Add to the log…"
          className="flex-1 rounded border border-gray-700 bg-transparent px-3 py-2 text-sm"
        />
        <button
          onClick={() => addEntry("roll")}
          className="rounded border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800"
        >
          Roll
        </button>
        <button
          onClick={() => addEntry("attack")}
          className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500"
        >
          Attack
        </button>
      </div>
    </div>
  );
}
