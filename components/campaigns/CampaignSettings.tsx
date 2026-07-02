"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCampaign, deleteCampaign } from "@/app/actions/campaigns";
import { Button, TextField, TextArea, Typography } from "@/components/ui";

export function CampaignSettings({
  campaignId,
  initialName,
  initialDescription,
}: {
  campaignId: string;
  initialName: string;
  initialDescription: string;
}) {
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
          Campaign settings
        </Typography>
        <Typography variant="muted" className="mt-1">
          Update the name and description your players see.
        </Typography>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <TextField
            id="settings-name"
            label="Name"
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
                Description{" "}
                <span className="font-normal text-gray-400">(optional)</span>
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
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            {saved && !dirty && (
              <span className="text-sm text-gray-500">Saved.</span>
            )}
          </div>
        </form>
      </section>

      <section id="campaign-settings-danger" className="rounded-2xl border border-red-200 bg-white p-6">
        <Typography variant="h3" as="h2" className="text-red-700">
          Danger zone
        </Typography>
        <Typography variant="subtitle" className="mt-1 text-sm">
          Deleting a campaign permanently removes it and all of its content for
          everyone. This cannot be undone.
        </Typography>

        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              Are you sure?
            </span>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Yes, delete it"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="dangerOutline"
            className="mt-4"
            onClick={() => setConfirmDelete(true)}
          >
            Delete campaign
          </Button>
        )}
      </section>
    </div>
  );
}
