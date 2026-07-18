"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCampaign, deleteCampaign } from "@/app/actions/campaigns";
import type { CampaignPeopleForAdmin } from "@/lib/queries/invites";
import { CampaignImageSettings } from "@/components/campaigns/CampaignImageSettings";
import { CampaignMembersSettings } from "@/components/campaigns/CampaignMembersSettings";
import { Button, TextField, TextArea, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function CampaignSettings({
  campaignId,
  initialName,
  initialDescription,
  imageUrl,
  people,
}: {
  campaignId: string;
  initialName: string;
  initialDescription: string;
  imageUrl: string | null;
  people: CampaignPeopleForAdmin;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const dirty =
    name !== initialName || description !== initialDescription;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startSave(async () => {
      const result = await updateCampaign(campaignId, { name, description });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      const result = await deleteCampaign(campaignId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/campaigns");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section id="campaign-settings-general" className="rounded-2xl border border-gray-200 bg-white p-6">
        <Typography variant="h3" as="h2">
          {t("campaignSettings.general")}
        </Typography>
        <Typography variant="muted" className="mt-1">
          {t("campaignSettings.generalDesc")}
        </Typography>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <TextField
            id="settings-name"
            label={t("campaignSettings.nameLabel")}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            maxLength={120}
          />

          <TextArea
            id="settings-description"
            label={
              <>
                {t("campaignSettings.descriptionLabel")}{" "}
                <span className="font-normal text-gray-400">
                  {t("campaignSettings.descriptionHint")}
                </span>
              </>
            }
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSaved(false);
            }}
            rows={4}
            maxLength={2000}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSaving || !dirty || !name.trim()}
            >
              {isSaving ? `${t("campaignSettings.saving")}` : t("campaignSettings.save")}
            </Button>
            {saved && !dirty && (
              <span className="text-sm text-gray-500">{t("campaignSettings.saved")}</span>
            )}
          </div>
        </form>
      </section>

      <CampaignImageSettings campaignId={campaignId} imageUrl={imageUrl} />

      <CampaignMembersSettings campaignId={campaignId} people={people} />

      <section id="campaign-settings-danger" className="rounded-2xl border border-red-200 bg-white p-6">
        <Typography variant="h3" as="h2" className="text-red-700">
          {t("campaignSettings.dangerZone")}
        </Typography>
        <Typography variant="subtitle" className="mt-1 text-sm">
          {t("campaignSettings.deleteDesc")}
        </Typography>

        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              {t("campaignSettings.deleteConfirm")}
            </span>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t("campaignSettings.deleting") : t("campaignSettings.deleteConfirmBtn")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              {t("buttons.cancel")}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="dangerOutline"
            className="mt-4"
            onClick={() => setConfirmDelete(true)}
          >
            {t("campaignSettings.delete")}
          </Button>
        )}
      </section>
    </div>
  );
}
