"use client";

import { useEffect, useState, useTransition } from "react";
import { createResourceCard } from "@/app/actions/resources";
import { useI18n } from "@/lib/i18n/context";
import type { InventoryCharacterOption } from "@/lib/resources/types";
import { Button, TextField, Typography } from "@/components/ui";
import { useResources } from "./ResourcesContext";

export function AddCardDialog({
  campaignId,
  inventoryCharacters,
  linkedCharacterIds,
}: {
  campaignId: string;
  inventoryCharacters: InventoryCharacterOption[];
  linkedCharacterIds: Set<string>;
}) {
  const { t } = useI18n();
  const { reconcile } = useResources();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"standalone" | "character">("standalone");
  const [name, setName] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableCharacters = inventoryCharacters.filter(
    (c) => !linkedCharacterIds.has(c.id)
  );

  function reset() {
    setMode("standalone");
    setName("");
    setCharacterId("");
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
      try {
        const result = await createResourceCard(
          mode === "character"
            ? { campaignId, characterId }
            : { campaignId, name }
        );
        if (!result?.ok) {
          setError(result?.error ?? t("errors.create"));
          return;
        }
        close();
        // The server assigns the new card's grid layout, so re-read rather than
        // guessing — one targeted query, not a full page render.
        await reconcile();
      } catch {
        setError(t("errors.create"));
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {t("resources.add")}
      </Button>

      {open && (
        <div
          id="add-resource-card-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-resource-card-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <Typography variant="h3" as="h2" id="add-resource-card-title">
              {t("resources.newCard")}
            </Typography>
            <Typography variant="muted" className="mt-1">
              Track spell slots, abilities, and other resources per character.
            </Typography>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMode("standalone")}
                  className={`flex-1 rounded-lg px-3 py-2 ${
                    mode === "standalone"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  Custom name
                </button>
                <button
                  type="button"
                  onClick={() => setMode("character")}
                  className={`flex-1 rounded-lg px-3 py-2 ${
                    mode === "character"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  From inventory
                </button>
              </div>

              {mode === "standalone" ? (
                <TextField
                  id="resource-card-name"
                  label={t("resources.cardName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  maxLength={80}
                  placeholder={t("resources.cardNamePlaceholder")}
                />
              ) : availableCharacters.length > 0 ? (
                <div>
                  <label
                    htmlFor="resource-card-character"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Inventory character
                  </label>
                  <select
                    id="resource-card-character"
                    value={characterId}
                    onChange={(e) => setCharacterId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a character…</option>
                    {availableCharacters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Typography variant="muted">
                  All inventory characters already have resource cards.
                </Typography>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={isPending}
                >
                  {t("buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    (mode === "standalone"
                      ? !name.trim()
                      : !characterId || availableCharacters.length === 0)
                  }
                >
                  {isPending ? t("campaignSettings.saving") : t("resources.add")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
