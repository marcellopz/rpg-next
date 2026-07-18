"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCharacter } from "@/app/actions/inventory";
import { Button, TextField, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function AddCharacterDialog({
  campaignId,
  characterHref,
}: {
  campaignId: string;
  /** Builds the URL that selects a character, so we can jump to the new one. */
  characterHref: (characterId: string) => string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [strength, setStrength] = useState("10");
  const [gold, setGold] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setStrength("10");
    setGold("0");
    setError(null);
  }

  function close() {
    if (isPending) return;
    setOpen(false);
    reset();
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCharacter({
        campaignId,
        name,
        strength: Number(strength) || 0,
        gold: Number(gold) || 0,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
      // No refresh needed: pushing the new character's URL fetches a fresh render.
      router.push(characterHref(result.data.id));
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => setOpen(true)}
      >
        {t("addCharacter.add")}
      </Button>

      {open && (
        <div id="add-character-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-character-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <Typography variant="h3" as="h2" id="add-character-title">
              {t("addCharacter.title")}
            </Typography>
            <Typography variant="muted" className="mt-1">
              {t("addCharacter.description")}
            </Typography>

            <form id="add-character-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
              <TextField
                id="character-name"
                label={t("addCharacter.name")}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={80}
                placeholder={t("addCharacter.namePlaceholder")}
              />

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  id="character-strength"
                  label={t("addCharacter.strength")}
                  type="number"
                  min={0}
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                />
                <TextField
                  id="character-gold"
                  label={t("addCharacter.gold")}
                  type="number"
                  min={0}
                  value={gold}
                  onChange={(e) => setGold(e.target.value)}
                />
              </div>

              {error && (
                <p id="add-character-error" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={isPending}
                >
                  {t("addCharacter.cancel")}
                </Button>
                <Button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? t("addCharacter.adding") : t("addCharacter.add")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
