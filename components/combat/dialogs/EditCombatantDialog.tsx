"use client";

import { FormEvent, useState } from "react";
import { updateCombatant } from "@/app/actions/combat";
import type { CombatCombatant, CombatantType } from "@/lib/combat/types";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button, TextField, Typography } from "@/components/ui";
import { CombatNestedDialog } from "@/components/combat/dialogs/CombatNestedDialog";

export function EditCombatantDialog({
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
  const [fullHp, setFullHp] = useState(combatant.hp === combatant.maxHp);
  const [visible, setVisible] = useState(combatant.visible);
  const [nameHidden, setNameHidden] = useState(combatant.nameHidden);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const initiative = Number(form.get("initiative"));
    const maxHp = Number(form.get("maxHp"));
    const hp = fullHp ? maxHp : Number(form.get("hp"));
    const ac = Number(form.get("ac"));
    const combatantType = String(form.get("type")) as CombatantType;
    const alias = String(form.get("alias") ?? "").trim();

    setPending(true);
    const result = await updateCombatant({
      campaignId,
      combatantId: combatant.id,
      name,
      initiative,
      hp,
      maxHp,
      ac,
      combatantType,
      visible,
      nameHidden,
      alias: nameHidden ? alias : null,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <CombatNestedDialog open={open} onClose={onClose} title="Edit combatant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="edit-combat-name"
          name="name"
          label="Name"
          defaultValue={combatant.name}
          required
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            checked={nameHidden}
            onChange={() => setNameHidden(!nameHidden)}
          />
          Hide name from players
        </label>
        <TextField
          id="edit-combat-alias"
          name="alias"
          label="Visible name (alias)"
          defaultValue={combatant.alias ?? ""}
          disabled={!nameHidden}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="edit-combat-initiative"
            name="initiative"
            label="Initiative"
            type="number"
            defaultValue={String(combatant.initiative)}
            required
          />
          <TextField
            id="edit-combat-ac"
            name="ac"
            label="AC"
            type="number"
            defaultValue={String(combatant.ac)}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <TextField
              id="edit-combat-max-hp"
              name="maxHp"
              label="Max HP"
              type="number"
              defaultValue={String(combatant.maxHp)}
              required
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                checked={fullHp}
                onChange={() => setFullHp(!fullHp)}
              />
              Full HP
            </label>
          </div>
          <TextField
            id="edit-combat-hp"
            name="hp"
            label="Current HP"
            type="number"
            defaultValue={String(combatant.hp)}
            disabled={fullHp}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="edit-combat-type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="edit-combat-type"
            name="type"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-accent-500 focus:outline-none"
            defaultValue={combatant.combatantType}
          >
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="undead">Undead</option>
            <option value="ally">Ally</option>
          </select>
        </div>
        <label className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            checked={visible}
            onChange={() => setVisible(!visible)}
          />
          Visible to players
        </label>
        {error && (
          <Typography variant="small" className="text-red-600">
            {error}
          </Typography>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            Save
          </Button>
        </div>
      </form>
    </CombatNestedDialog>
  );
}
