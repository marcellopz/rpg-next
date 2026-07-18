"use client";

import { FormEvent, useState } from "react";
import { addCondition } from "@/app/actions/combat";
import type { CombatCombatant } from "@/lib/combat/types";
import { CONDITION_COLORS } from "@/lib/combat/types";
import { useI18n } from "@/lib/i18n/context";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button, TextField, Typography } from "@/components/ui";
import { ConditionChip } from "@/components/combat/ConditionChip";
import { CombatNestedDialog } from "@/components/combat/dialogs/CombatNestedDialog";
import { cn } from "@/lib/cn";

export function AddConditionDialog({
  open,
  combatant,
  onClose,
}: {
  open: boolean;
  combatant: CombatCombatant;
  onClose: () => void;
}) {
  const { t } = useI18n();
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
      setError(t("validation.required", { field: "Condition name" }));
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
      title={t("addCondition.title")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="condition-name"
          name="name"
          label={t("addCondition.name")}
          required
          value={previewName}
          onChange={(e) => setPreviewName(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            checked={indefinite}
            onChange={() => setIndefinite(!indefinite)}
          />
          Indefinite duration
        </label>
        {!indefinite && (
          <TextField
            id="condition-duration"
            name="duration"
            label={t("addCondition.duration")}
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
                className={cn(
                  "h-8 w-8 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                  color === preset.color && "ring-2 ring-accent-600"
                )}
                style={{ backgroundColor: preset.color }}
                aria-label={`Use ${preset.name}`}
                aria-pressed={color === preset.color}
                onClick={() => setColor(preset.color)}
              />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Preview
          </p>
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
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {t("buttons.add")}
          </Button>
        </div>
      </form>
    </CombatNestedDialog>
  );
}
