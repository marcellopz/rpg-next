"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import type { CombatState } from "@/lib/combat/types";
import { CombatTrackerModal } from "@/components/combat/modal/CombatTrackerModal";
import { CombatTrackerProvider } from "@/components/combat/CombatTrackerContext";
import { useOptionalDemoSandbox } from "@/components/campaigns/DemoSandboxProvider";
import { Button } from "@/components/ui";

export function CombatTrackerLauncher({
  campaignId,
  isDm,
  combat,
  readOnly,
}: {
  campaignId: string;
  isDm: boolean;
  combat: CombatState | null;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const sandbox = useOptionalDemoSandbox();

  return (
    <CombatTrackerProvider
      campaignId={campaignId}
      isDm={sandbox ? sandbox.combatIsDm : isDm}
      setIsDm={sandbox ? sandbox.setCombatIsDm : undefined}
      initialCombat={sandbox ? sandbox.combat : combat}
      enabled={open}
      readOnly={readOnly}
      localOnly={!!sandbox}
      onCombatChange={
        sandbox
          ? (next) => {
              if (next) sandbox.setCombat(next);
            }
          : undefined
      }
    >
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
      <CombatTrackerModal open={open} onClose={() => setOpen(false)} />
    </CombatTrackerProvider>
  );
}
