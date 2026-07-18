"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/app/actions/campaigns";
import { Button, TextField, TextArea, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function NewCampaignButton() {
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setDescription("");
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
      const result = await createCampaign({ name, description });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
      router.push(`/campaigns/${result.data.publicCode}`);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {t("campaigns.new")}
      </Button>

      {open && (
        <div id="new-campaign-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-campaign-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <Typography variant="h3" as="h2" id="new-campaign-title">
              {t("newCampaign.title")}
            </Typography>
            <Typography variant="muted" className="mt-1">
              {t("newCampaign.subtitle")}
            </Typography>

            <form id="new-campaign-form" onSubmit={handleSubmit} className="mt-4 space-y-4">
              <TextField
                id="campaign-name"
                label={t("newCampaign.name")}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                maxLength={120}
                placeholder={t("newCampaign.namePlaceholder")}
              />

              <TextArea
                id="campaign-description"
                label={
                  <>
                    {t("newCampaign.description")}{" "}
                    <span className="font-normal text-gray-400">{t("campaignSettings.descriptionHint")}</span>
                  </>
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("newCampaign.descriptionPlaceholder")}
              />

              {error && <p id="new-campaign-error" className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={isPending}
                >
                  {t("buttons.cancel")}
                </Button>
                <Button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? `${t("buttons.loading")}` : t("newCampaign.create")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
