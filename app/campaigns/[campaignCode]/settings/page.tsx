import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";
import { CampaignSettings } from "@/components/campaigns/CampaignSettings";
import { Typography, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getCampaignDetailForCurrentUser } from "@/lib/queries/campaigns";
import { getCampaignPeopleForAdmin } from "@/lib/queries/invites";

export default async function CampaignSettingsPage({
  params,
}: {
  params: { campaignCode: string };
}) {
  const { t } = await getServerTranslations("en");
  const campaign = await getCampaignDetailForCurrentUser(params.campaignCode);

  if (!campaign || !campaign.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Typography variant="h2">{t("campaignSettings.notAvailable")}</Typography>
        <Typography variant="subtitle" className="mt-2">
          {t("campaignSettings.notAvailableDesc")}
        </Typography>
        <Link href="/campaigns" className={cn("mt-6", buttonVariants())}>
          {t("buttons.backToCampaigns")}
        </Link>
      </div>
    );
  }

  const people = await getCampaignPeopleForAdmin(campaign.id);

  return (
    <div id="campaign-settings-page" className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/campaigns/${campaign.publicCode}`}
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        {t("campaignSettings.backToCampaign")}
      </Link>

      <header className="mt-4">
        <Typography variant="h1">{t("campaignSettings.title")}</Typography>
        <Typography variant="subtitle" className="mt-2">
          {t("campaignSettings.adminOnlyDesc", { name: campaign.name })}
        </Typography>
      </header>

      <div className="mt-8">
        <CampaignSettings
          campaignId={campaign.id}
          initialName={campaign.name}
          initialDescription={campaign.description}
          imageUrl={campaign.imageUrl}
          people={people ?? { members: [], invites: [] }}
        />
      </div>
    </div>
  );
}
