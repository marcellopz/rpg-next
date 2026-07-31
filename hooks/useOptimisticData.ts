"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/app/actions/campaigns";

// Client-owned copy of server data with optimistic mutations.
//
// Generalized from CombatTrackerContext's runAction, which established this
// pattern for the combat tracker. The problem it solves: a server action is a
// network round trip, and the workspace page is fully dynamic, so waiting for
// the action (then re-rendering the whole page) made every edit take seconds.
// Here the mutation paints immediately and the server call happens behind it.
//
// Three behaviours matter:
//  - Apply locally first, so the UI never waits on the network.
//  - On failure, resync from the server when a refetch is available (the
//    authoritative recovery) and fall back to the pre-mutation snapshot.
//  - Never adopt incoming server data while a mutation is in flight, or a
//    late-arriving payload would clobber the edit the user just made.

type UseOptimisticDataOptions<T> = {
  /**
   * Authoritative re-read of this data. Used to reconcile server-derived values
   * (generated ids, sort_order, log timestamps) and to recover from a failed
   * mutation. One targeted query — not a full page re-render.
   */
  refetch?: () => Promise<T>;
  /** Defaults to window.alert, matching what every call site did before. */
  onError?: (message: string) => void;
  /** Skip all mutations and reconciliation (demo / read-only campaigns). */
  disabled?: boolean;
};

export function useOptimisticData<T>(
  serverValue: T,
  options: UseOptimisticDataOptions<T> = {}
) {
  const { refetch, onError, disabled } = options;

  const [data, setData] = useState<T>(serverValue);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Ref, not state: `run` must read the live count without being re-created.
  const pendingRef = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  function reportError(message: string) {
    if (onErrorRef.current) onErrorRef.current(message);
    else window.alert(message);
  }

  // Adopt a fresh server render only when we have no unconfirmed local edits.
  // `serverValue` keeps its identity across pure client re-renders, so this
  // fires on genuinely new server data rather than on every parent render.
  useEffect(() => {
    if (pendingRef.current === 0) setData(serverValue);
  }, [serverValue]);

  // Set when a resync is owed but couldn't run because another mutation was
  // still in flight — without this, a failure during concurrent mutations would
  // leave its bad optimistic change applied and never corrected.
  const resyncOwedRef = useRef(false);

  /** Re-read from the server and adopt, unless a mutation is in flight. */
  const reconcile = useCallback(async () => {
    if (disabled || !refetchRef.current) return;
    if (pendingRef.current > 0) {
      resyncOwedRef.current = true;
      return;
    }
    resyncOwedRef.current = false;
    const fresh = await refetchRef.current();
    if (pendingRef.current === 0) setData(fresh);
  }, [disabled]);

  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;

  const setPending = useCallback((next: number) => {
    pendingRef.current = next;
    setPendingCount(next);
    // Everything settled and someone still owes a resync — run it now.
    if (next === 0 && resyncOwedRef.current) {
      void reconcileRef.current();
    }
  }, []);

  /**
   * Apply `mutator` locally, then run `action`. Rolls back on failure.
   *
   * Pass `reconcile: true` when the server produces values the client can't
   * predict (row ids, sort_order, log entries) and the local guess should be
   * replaced by the truth once the write lands.
   *
   * Pass `silent: true` when the caller renders the error itself (inline form
   * validation) so it isn't also reported through onError.
   */
  const run = useCallback(
    async <R,>(
      mutator: (prev: T) => T,
      action: () => Promise<ActionResult<R>>,
      opts: { reconcile?: boolean; silent?: boolean } = {}
    ): Promise<ActionResult<R>> => {
      if (disabled) {
        return { ok: true, data: undefined as R };
      }

      const snapshot = dataRef.current;
      setData(mutator);
      setPending(pendingRef.current + 1);

      let result: ActionResult<R>;
      try {
        result = await action();
      } catch (err) {
        setPending(pendingRef.current - 1);
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        // A thrown action left the server state unknown — prefer the server's
        // answer over our guess.
        // Prefer the server's answer. `snapshot` is only a fallback for callers
        // with no refetch, and is best-effort: with concurrent mutations it can
        // also discard a sibling's change.
        if (refetchRef.current) void reconcile();
        else setData(snapshot);
        if (!opts.silent) reportError(message);
        return { ok: false, error: message };
      }

      setPending(pendingRef.current - 1);

      if (!result.ok) {
        // Prefer the server's answer. `snapshot` is only a fallback for callers
        // with no refetch, and is best-effort: with concurrent mutations it can
        // also discard a sibling's change.
        if (refetchRef.current) void reconcile();
        else setData(snapshot);
        if (!opts.silent) reportError(result.error);
        return result;
      }

      if (opts.reconcile) void reconcile();
      return result;
    },
    [disabled, reconcile, setPending]
  );

  return {
    data,
    setData,
    run,
    reconcile,
    isPending: pendingCount > 0,
  };
}
