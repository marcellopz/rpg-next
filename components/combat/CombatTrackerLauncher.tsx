"use client";

import { useState } from "react";
import type { CombatState } from "@/lib/combat/types";
import { CombatTrackerModal } from "@/components/combat/CombatTrackerModal";
import { Button } from "@/components/ui";

export function CombatTrackerLauncher({
  campaignId,
  isDm,
  combat,
}: {
  campaignId: string;
  isDm: boolean;
  combat: CombatState | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="white"
        size="md"
        className="font-semibold shadow-lg shadow-black/10"
        onClick={() => setOpen(true)}
      >
        Combat tracker
      </Button>
      <CombatTrackerModal
        open={open}
        campaignId={campaignId}
        isDm={isDm}
        combat={combat}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
