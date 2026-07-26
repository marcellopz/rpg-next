"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { updateCampaignImage } from "@/app/actions/campaigns";
import { ImageCropDialog } from "@/components/images/ImageCropDialog";
import { Button, Typography } from "@/components/ui";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useI18n } from "@/lib/i18n/context";

// Admin-only settings section for the campaign cover image, shown on the
// campaign card and as the workspace hero background.
export function CampaignImageSettings({
  campaignId,
  imageUrl,
}: {
  campaignId: string;
  imageUrl: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { upload } = useFileUpload("public");

  async function saveImage(blob: Blob): Promise<string | null> {
    const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
    const uploaded = await upload(file, { campaignId, folder: "cover" });
    if (!uploaded) return t("errors.save");
    const result = await updateCampaignImage(campaignId, uploaded.path);
    if (!result.ok) return result.error;
    router.refresh();
    return null;
  }

  async function removeImage(): Promise<string | null> {
    const result = await updateCampaignImage(campaignId, null);
    if (!result.ok) return result.error;
    router.refresh();
    return null;
  }

  return (
    <section
      id="campaign-settings-image"
      className="rounded-2xl border border-gray-200 bg-white p-6"
    >
      <Typography variant="h3" as="h2">
        {t("campaignImage.title")}
      </Typography>
      <Typography variant="muted" className="mt-1">
        {t("campaignImage.description")}
      </Typography>

      <div className="mt-4 space-y-3">
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl border border-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Campaign cover"
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-accent-600 to-accent-800 text-white/80">
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
              <span className="text-xs">No image yet</span>
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          {imageUrl ? t("campaignImage.changeFile") : t("campaignImage.choose")}
        </Button>
      </div>

      {dialogOpen && (
        <ImageCropDialog
          title={t("campaignImage.title")}
          description={t("campaignImage.description")}
          aspect={3}
          outputWidth={1500}
          outputHeight={500}
          onSave={saveImage}
          onRemove={imageUrl ? removeImage : undefined}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </section>
  );
}
