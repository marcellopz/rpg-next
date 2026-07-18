"use client";

import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { Typography } from "@/components/ui";
import { DEMO_CAMPAIGNS } from "@/data/demo-campaigns";
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
        {DEMO_CAMPAIGNS.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}
