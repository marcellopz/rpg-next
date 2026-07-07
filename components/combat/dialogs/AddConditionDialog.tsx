"use client";

import { FormEvent, useState } from "react";
import { addCondition } from "@/app/actions/combat";
import type { CombatCombatant } from "@/lib/combat/types";
import { CONDITION_COLORS } from "@/lib/combat/types";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button, TextField, Typography } from "@/components/ui";
import { ConditionChip } from "@/components/combat/ConditionChip";
import { CombatNestedDialog } from "@/components/combat/dialogs/CombatNestedDialog";

export function AddConditionDialog({
  open,
  combatant,
  onClose,
}: {
  open: boolean;
  combatant: CombatCombatant;
  onClose: () => void;
}) {
  const { campaignId } = useCombatTracker();
  const [error, setError] = useState<string | null>(null);
  const [indefinite, setIndefinite] = useState(false);
  const [color, setColor] = useState<string>(CONDITION_COLORS[0].color);
  const [previewName, setPreviewName] = useState("");
  const [previewDuration, setPreviewDuration] = useState(1);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const duration = indefinite ? -1 : Number(form.get("duration"));

    if (!name) {
      setError("Condition name is required.");
      return;
    }

    setPending(true);
    const result = await addCondition({
      campaignId,
      combatantId: combatant.id,
      name,
      duration,
      color,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <CombatNestedDialog
      open={open}
      onClose={onClose}
      title={`Add condition to ${combatant.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="condition-name"
          name="name"
          label="Condition name"
          required
          value={previewName}
          onChange={(e) => setPreviewName(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={indefinite}
            onChange={() => setIndefinite(!indefinite)}
          />
          Indefinite duration
        </label>
        {!indefinite && (
          <TextField
            id="condition-duration"
            name="duration"
            label="Duration (turns)"
            type="number"
            min={1}
            defaultValue="1"
            onChange={(e) => setPreviewDuration(Number(e.target.value) || 1)}
          />
        )}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Color</p>
          <div className="flex flex-wrap gap-2">
            {CONDITION_COLORS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="h-8 w-8 rounded-full border-2"
                style={{
                  backgroundColor: preset.color,
                  borderColor: color === preset.color ? "#333" : "transparent",
                }}
                aria-label={preset.name}
                onClick={() => setColor(preset.color)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm text-gray-600">Preview</p>
          <ConditionChip
            conditionId="preview"
            title={previewName || "Condition"}
            duration={indefinite ? -1 : previewDuration}
            color={color}
            isDm={false}
          />
        </div>
        {error && (
          <Typography variant="small" className="text-red-600">
            {error}
          </Typography>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            Add
          </Button>
        </div>
      </form>
    </CombatNestedDialog>
  );
}
