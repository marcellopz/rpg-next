"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
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
        size="sm"
        className="font-semibold shadow-sm"
        onClick={() => setOpen(true)}
      >
        <Swords className="mr-1.5 h-4 w-4" aria-hidden />
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
