import Link from "next/link";
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
  const campaign = await getCampaignDetailForCurrentUser(params.campaignCode);

  if (!campaign || !campaign.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Typography variant="h2">Campaign settings not available</Typography>
        <Typography variant="subtitle" className="mt-2">
          This campaign doesn&apos;t exist, or you don&apos;t have permission to
          manage it.
        </Typography>
        <Link href="/campaigns" className={cn("mt-6", buttonVariants())}>
          Back to campaigns
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
        Back to campaign
      </Link>

      <header className="mt-4">
        <Typography variant="h1">Campaign settings</Typography>
        <Typography variant="subtitle" className="mt-2">
          Manage the campaign profile and destructive actions for{" "}
          <span className="font-medium text-gray-900">{campaign.name}</span>.
        </Typography>
      </header>

      <div className="mt-8">
        <CampaignSettings
          campaignId={campaign.id}
          initialName={campaign.name}
          initialDescription={campaign.description}
          people={people ?? { members: [], invites: [] }}
        />
      </div>
    </div>
  );
}
