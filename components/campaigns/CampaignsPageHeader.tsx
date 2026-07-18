"use client";

import { Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function CampaignsPageHeaderBrowse() {
  const { t } = useI18n();

  return (
    <div>
      <Typography variant="h1">{t("campaigns.title")}</Typography>
      <Typography variant="subtitle" className="mt-1">
        {t("campaigns.noCampaignsBrowse")}
      </Typography>
    </div>
  );
}

export function CampaignsPageHeaderOwned() {
  const { t } = useI18n();

  return (
    <div>
      <Typography variant="h1">{t("campaigns.title")}</Typography>
      <Typography variant="subtitle" className="mt-1">
        {t("campaigns.noCampaignsOwnedHint")}
      </Typography>
    </div>
  );
}
