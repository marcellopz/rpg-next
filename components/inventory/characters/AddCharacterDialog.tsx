"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCharacter } from "@/app/actions/inventory";
import { Button, TextField, Typography } from "@/components/ui";

export function AddCharacterDialog({
  campaignId,
  characterHref,
}: {
  campaignId: string;
  /** Builds the URL that selects a character, so we can jump to the new one. */
  characterHref: (characterId: string) => string;
}) {
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
      router.push(characterHref(result.data.id));
      router.refresh();
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
        Add character
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
              Add character
            </Typography>
            <Typography variant="muted" className="mt-1">
              A new party member with their own inventory.
            </Typography>

            <form id="add-character-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
              <TextField
                id="character-name"
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={80}
                placeholder="Fenwick the Bold"
              />

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  id="character-strength"
                  label="Strength"
                  type="number"
                  min={0}
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                />
                <TextField
                  id="character-gold"
                  label="Gold"
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? "Adding…" : "Add character"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
