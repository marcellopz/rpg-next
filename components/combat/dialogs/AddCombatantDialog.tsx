"use client";

import { FormEvent, useState } from "react";
import { addCombatant } from "@/app/actions/combat";
import { applyAddCombatant } from "@/lib/combat/turn-engine";
import type { CombatantType } from "@/lib/combat/types";
import { useI18n } from "@/lib/i18n/context";
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
  const { t } = useI18n();
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
    <CombatNestedDialog open={open} onClose={onClose} title={t("addCombatant.title")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField id="combat-name" name="name" label={t("addCombatant.name")} required />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            checked={nameHidden}
            onChange={() => setNameHidden(!nameHidden)}
          />
          {t("addCombatant.hideName")}
        </label>
        <TextField
          id="combat-alias"
          name="alias"
          label="Visible name (alias)"
          disabled={!nameHidden}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="combat-initiative"
            name="initiative"
            label={t("addCombatant.initiative")}
            type="number"
            required
          />
          <TextField id="combat-ac" name="ac" label={t("addCombatant.ac")} type="number" required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <TextField
              id="combat-max-hp"
              name="maxHp"
              label={t("addCombatant.hp")}
              type="number"
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
            id="combat-hp"
            name="hp"
            label="Current HP"
            type="number"
            disabled={fullHp}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="combat-type" className="block text-sm font-medium text-gray-700">
            {t("addCombatant.type")}
          </label>
          <select
            id="combat-type"
            name="type"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-accent-500 focus:outline-none"
            defaultValue="enemy"
          >
            <option value="player">{t("combat.player")}</option>
            <option value="enemy">{t("combat.enemy")}</option>
            <option value="undead">{t("combat.undead")}</option>
            <option value="ally">{t("combat.ally")}</option>
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
