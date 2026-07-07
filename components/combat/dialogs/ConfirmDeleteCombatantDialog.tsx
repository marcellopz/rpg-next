"use client";

import { useState } from "react";
import { deleteCombatant } from "@/app/actions/combat";
import { applyRemoveCombatant } from "@/lib/combat/turn-engine";
import type { CombatCombatant } from "@/lib/combat/types";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button, Typography } from "@/components/ui";
import { CombatNestedDialog } from "@/components/combat/dialogs/CombatNestedDialog";

export function ConfirmDeleteCombatantDialog({
  open,
  combatant,
  onClose,
}: {
  open: boolean;
  combatant: CombatCombatant;
  onClose: () => void;
}) {
  const { campaignId, runAction } = useCombatTracker();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await runAction(
      (prev) => (prev ? applyRemoveCombatant(prev, combatant.id) : prev),
      () =>
        deleteCombatant({
          campaignId,
          combatantId: combatant.id,
        })
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <CombatNestedDialog open={open} onClose={onClose} title="Delete combatant">
      <Typography variant="body" className="mb-4">
        Delete <strong>{combatant.name}</strong> from combat?
      </Typography>
      {error && (
        <Typography variant="small" className="mb-4 text-red-600">
          {error}
        </Typography>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </CombatNestedDialog>
  );
}
