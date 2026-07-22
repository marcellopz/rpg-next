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
import type { ActionResult } from "@/app/actions/campaigns";
import { fetchCombatClient } from "@/lib/combat/client-state";
import type { CombatState } from "@/lib/combat/types";
import { createClient } from "@/lib/supabase/client";

type CombatTrackerContextValue = {
  combat: CombatState | null;
  campaignId: string;
  isDm: boolean;
  setCombat: React.Dispatch<React.SetStateAction<CombatState | null>>;
  refreshCombat: () => Promise<void>;
  runAction: <T>(
    optimistic: (prev: CombatState | null) => CombatState | null,
    action: () => Promise<ActionResult<T>>
  ) => Promise<ActionResult<T>>;
  readOnly: boolean;
};

const CombatTrackerContext = createContext<CombatTrackerContextValue | null>(
  null
);

const TABLES = ["combat_sessions", "combat_combatants", "combat_conditions"];

export function CombatTrackerProvider({
  campaignId,
  isDm,
  initialCombat,
  enabled,
  readOnly,
  children,
}: {
  campaignId: string;
  isDm: boolean;
  initialCombat: CombatState | null;
  enabled: boolean;
  readOnly?: boolean;
  children: ReactNode;
}) {
  const [combat, setCombat] = useState<CombatState | null>(initialCombat);
  const combatRef = useRef(combat);
  combatRef.current = combat;
  const isDmRef = useRef(isDm);
  isDmRef.current = isDm;

  const refreshCombat = useCallback(async () => {
    if (readOnly) return;
    const next = await fetchCombatClient(campaignId);
    setCombat(next);
  }, [campaignId, readOnly]);

  const refreshCombatRef = useRef(refreshCombat);
  refreshCombatRef.current = refreshCombat;

  // Fetch fresh state whenever the modal opens — do not re-sync from stale
  // server props while the modal stays open (that blocked live player updates).
  // Skipped entirely for a read-only (demo) campaign: there is no real row to
  // fetch, and doing so would overwrite the static combat state with null.
  useEffect(() => {
    if (!enabled || readOnly) return;
    void refreshCombatRef.current();
  }, [enabled, campaignId, readOnly]);

  useEffect(() => {
    if (!enabled || readOnly) return;

    const supabase = createClient();
    const timerRef = { current: null as ReturnType<typeof setTimeout> | null };

    function scheduleRefresh() {
      // DM applies optimistic updates locally; refetch after actions complete.
      if (isDmRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void refreshCombatRef.current();
      }, 200);
    }

    let channel = supabase.channel(`combat-live:${campaignId}`);
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
      void supabase.removeChannel(channel);
    };
  }, [campaignId, enabled, readOnly]);

  const runAction = useCallback(
    async <T,>(
      optimistic: (prev: CombatState | null) => CombatState | null,
      action: () => Promise<ActionResult<T>>
    ): Promise<ActionResult<T>> => {
      if (readOnly) return { ok: true, data: undefined as T };
      const snapshot = combatRef.current;
      setCombat(optimistic);
      const result = await action();
      if (!result.ok) {
        setCombat(snapshot);
        return result;
      }
      void refreshCombatRef.current();
      return result;
    },
    [readOnly]
  );

  const value = useMemo(
    () => ({
      combat,
      campaignId,
      isDm,
      setCombat,
      refreshCombat,
      runAction,
      readOnly: !!readOnly,
    }),
    [combat, campaignId, isDm, refreshCombat, runAction, readOnly]
  );

  return (
    <CombatTrackerContext.Provider value={value}>
      {children}
    </CombatTrackerContext.Provider>
  );
}

export function useCombatTracker() {
  const ctx = useContext(CombatTrackerContext);
  if (!ctx) {
    throw new Error("useCombatTracker must be used within CombatTrackerProvider");
  }
  return ctx;
}
