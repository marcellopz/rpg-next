"use client";

import { Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function CampaignsEmptyState() {
  const { t } = useI18n();

  return (
    <>
      <Typography variant="h3">{t("campaigns.noCampaigns")}</Typography>
      <Typography variant="subtitle" className="mx-auto mt-1 max-w-sm text-sm">
        {t("campaigns.noCampaignsCreateHint")}
      </Typography>
    </>
  );
}
