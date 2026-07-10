"use client";

import { useState } from "react";
import { endCombat } from "@/app/actions/combat";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button, Typography } from "@/components/ui";
import { CombatNestedDialog } from "@/components/combat/dialogs/CombatNestedDialog";

export function ConfirmEndCombatDialog({
  open,
  onClose,
  onEndedFully,
}: {
  open: boolean;
  onClose: () => void;
  onEndedFully: () => void;
}) {
  const { campaignId, setCombat, refreshCombat } = useCombatTracker();
  const [keepPlayersOpen, setKeepPlayersOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(keepPlayers: boolean) {
    setPending(true);
    const result = await endCombat({ campaignId, keepPlayers });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setKeepPlayersOpen(false);
    onClose();
    if (!keepPlayers) {
      setCombat(null);
      onEndedFully();
    } else {
      await refreshCombat();
    }
  }

  return (
    <>
      <CombatNestedDialog open={open && !keepPlayersOpen} onClose={onClose} title="End combat">
        <Typography variant="body" className="mb-4">
          End this combat encounter?
        </Typography>
        {error && (
          <Typography variant="small" className="mb-4 text-red-600">
            {error}
          </Typography>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => setKeepPlayersOpen(true)}
          >
            End combat
          </Button>
        </div>
      </CombatNestedDialog>

      <CombatNestedDialog
        open={keepPlayersOpen}
        onClose={() => setKeepPlayersOpen(false)}
        title="Keep player combatants?"
      >
        <Typography variant="body" className="mb-4">
          Keep player characters in the tracker for the next encounter?
        </Typography>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setKeepPlayersOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => finish(false)}
          >
            No, clear all
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => finish(true)}
          >
            Yes, keep players
          </Button>
        </div>
      </CombatNestedDialog>
    </>
  );
}
