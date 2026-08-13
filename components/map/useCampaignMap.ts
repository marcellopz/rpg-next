"use client";

import { useCallback, useEffect, useState } from "react";
import { isDemoCampaignId } from "@/data/demo-campaign";
import { fetchMapForCampaignClient } from "@/lib/map/client-state";
import type { CampaignMap, MapPin } from "@/lib/map/types";

export function useCampaignMap(campaignId: string) {
  const [map, setMap] = useState<CampaignMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `background: true` skips the loading flag — used for post-mutation
  // reconciliation where the map is already on screen.
  const refresh = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (isDemoCampaignId(campaignId)) {
        setMap(null);
        setLoading(false);
        setError(null);
        return;
      }
      if (!background) setLoading(true);
      setError(null);
      try {
        const next = await fetchMapForCampaignClient(campaignId);
        setMap(next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load the map."
        );
        if (!background) setMap(null);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [campaignId]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Paint a new pin before/as the server confirms. */
  const addPinLocally = useCallback((pin: MapPin) => {
    setMap((prev) =>
      prev ? { ...prev, pins: [...prev.pins, pin] } : prev
    );
  }, []);

  /** Patch a pin locally — used for optimistic moves and edits. */
  const updatePinLocally = useCallback(
    (
      pinId: string,
      patch: Partial<Pick<MapPin, "x" | "y" | "label" | "description" | "type">>
    ) => {
      setMap((prev) =>
        prev
          ? {
              ...prev,
              pins: prev.pins.map((pin) =>
                pin.id === pinId ? { ...pin, ...patch } : pin
              ),
            }
          : prev
      );
    },
    []
  );

  /** Drop a pin locally so a delete paints before the server confirms. */
  const removePinLocally = useCallback((pinId: string) => {
    setMap((prev) =>
      prev
        ? { ...prev, pins: prev.pins.filter((pin) => pin.id !== pinId) }
        : prev
    );
  }, []);

  return {
    map,
    loading,
    error,
    refresh,
    addPinLocally,
    updatePinLocally,
    removePinLocally,
  };
}
