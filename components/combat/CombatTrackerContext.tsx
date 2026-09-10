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
  setIsDm?: (isDm: boolean) => void;
  setCombat: React.Dispatch<React.SetStateAction<CombatState | null>>;
  refreshCombat: () => Promise<void>;
  runAction: <T>(
    optimistic: (prev: CombatState | null) => CombatState | null,
    action: () => Promise<ActionResult<T>>
  ) => Promise<ActionResult<T>>;
  readOnly: boolean;
  localOnly: boolean;
};

const CombatTrackerContext = createContext<CombatTrackerContextValue | null>(
  null
);

const TABLES = ["combat_sessions", "combat_combatants", "combat_conditions"];

export function CombatTrackerProvider({
  campaignId,
  isDm,
  setIsDm,
  initialCombat,
  enabled,
  readOnly,
  localOnly,
  onCombatChange,
  children,
}: {
  campaignId: string;
  isDm: boolean;
  setIsDm?: (isDm: boolean) => void;
  initialCombat: CombatState | null;
  enabled: boolean;
  readOnly?: boolean;
  localOnly?: boolean;
  onCombatChange?: (combat: CombatState | null) => void;
  children: ReactNode;
}) {
  const skipPersist = !!readOnly || !!localOnly;
  const [combat, setCombat] = useState<CombatState | null>(initialCombat);
  const combatRef = useRef(combat);
  combatRef.current = combat;
  const isDmRef = useRef(isDm);
  isDmRef.current = isDm;
  const onCombatChangeRef = useRef(onCombatChange);
  onCombatChangeRef.current = onCombatChange;

  useEffect(() => {
    if (localOnly) onCombatChangeRef.current?.(combat);
  }, [combat, localOnly]);

  const refreshCombat = useCallback(async () => {
    if (skipPersist) return;
    const next = await fetchCombatClient(campaignId);
    setCombat(next);
  }, [campaignId, skipPersist]);

  const refreshCombatRef = useRef(refreshCombat);
  refreshCombatRef.current = refreshCombat;

  // Fetch fresh state whenever the modal opens — do not re-sync from stale
  // server props while the modal stays open (that blocked live player updates).
  // Skipped entirely for a read-only (demo) campaign: there is no real row to
  // fetch, and doing so would overwrite the static combat state with null.
  useEffect(() => {
    if (!enabled || skipPersist) return;
    void refreshCombatRef.current();
  }, [enabled, campaignId, skipPersist]);

  useEffect(() => {
    if (!enabled || skipPersist) return;

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
  }, [campaignId, enabled, skipPersist]);

  const runAction = useCallback(
    async <T,>(
      optimistic: (prev: CombatState | null) => CombatState | null,
      action: () => Promise<ActionResult<T>>
    ): Promise<ActionResult<T>> => {
      if (readOnly) return { ok: true, data: undefined as T };
      if (localOnly) {
        setCombat(optimistic);
        return { ok: true, data: undefined as T };
      }
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
    [readOnly, localOnly]
  );

  const value = useMemo(
    () => ({
      combat,
      campaignId,
      isDm,
      setIsDm,
      setCombat,
      refreshCombat,
      runAction,
      readOnly: !!readOnly,
      localOnly: !!localOnly,
    }),
    [
      combat,
      campaignId,
      isDm,
      setIsDm,
      refreshCombat,
      runAction,
      readOnly,
      localOnly,
    ]
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
