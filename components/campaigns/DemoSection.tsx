"use client";

import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Typography } from "@/components/ui";
import { DEMO_CAMPAIGN_CARD } from "@/data/demo-campaign";
import { useI18n } from "@/lib/i18n/context";

export function DemoSection() {
  const { t } = useI18n();

  return (
    <div id="campaigns-demo" className="mt-14">
      <Typography variant="h3" as="h2">
        {t("campaigns.demo")}
      </Typography>
      <Typography variant="subtitle" className="mt-1 text-sm">
        {t("campaigns.demoDesc")}
      </Typography>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <CampaignCard campaign={DEMO_CAMPAIGN_CARD} />
      </div>
    </div>
  );
}
