"use client";

import { FormEvent, useState } from "react";
import { addCombatant } from "@/app/actions/combat";
import { applyAddCombatant } from "@/lib/combat/turn-engine";
import type { CombatantType } from "@/lib/combat/types";
import { useCombatTracker } from "@/components/combat/CombatTrackerContext";
import { Button, TextField, Typography } from "@/components/ui";
import { CombatNestedDialog } from "@/components/combat/dialogs/CombatNestedDialog";

export function AddCombatantDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { campaignId, runAction } = useCombatTracker();
  const [error, setError] = useState<string | null>(null);
  const [fullHp, setFullHp] = useState(true);
  const [visible, setVisible] = useState(true);
  const [nameHidden, setNameHidden] = useState(false);
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
    const payload = {
      campaignId,
      name,
      initiative,
      hp,
      maxHp,
      ac,
      combatantType,
      visible,
      nameHidden,
      alias: nameHidden ? alias : null,
    };
    const result = await runAction(
      (prev) =>
        prev
          ? applyAddCombatant(prev, {
              name,
              initiative,
              hp,
              maxHp,
              ac,
              combatantType,
              visible,
              nameHidden,
              alias: nameHidden ? alias : null,
            })
          : prev,
      () => addCombatant(payload)
    );
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <CombatNestedDialog open={open} onClose={onClose} title="Add combatant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField id="combat-name" name="name" label="Name" required />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={nameHidden}
            onChange={() => setNameHidden(!nameHidden)}
          />
          Hide name from players
        </label>
        <TextField
          id="combat-alias"
          name="alias"
          label="Visible name (alias)"
          disabled={!nameHidden}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="combat-initiative"
            name="initiative"
            label="Initiative"
            type="number"
            required
          />
          <TextField id="combat-ac" name="ac" label="AC" type="number" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <TextField
              id="combat-max-hp"
              name="maxHp"
              label="Max HP"
              type="number"
              required
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fullHp}
                onChange={() => setFullHp(!fullHp)}
              />
              Full HP
            </label>
          </div>
          <TextField
            id="combat-hp"
            name="hp"
            label="Current HP"
            type="number"
            disabled={fullHp}
          />
        </div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          name="type"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          defaultValue="enemy"
        >
          <option value="player">Player</option>
          <option value="enemy">Enemy</option>
          <option value="undead">Undead</option>
          <option value="ally">Ally</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
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
