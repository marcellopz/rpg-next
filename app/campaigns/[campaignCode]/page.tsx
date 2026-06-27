import Link from "next/link";
import { CampaignSettings } from "@/components/campaigns/CampaignSettings";
import { Typography, buttonVariants, Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getCampaignDetailForCurrentUser } from "@/lib/queries/campaigns";

export default async function CampaignPage({
  params,
}: {
  params: { campaignCode: string };
}) {
  const campaign = await getCampaignDetailForCurrentUser(params.campaignCode);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <Typography variant="h2">Campaign not found</Typography>
        <Typography variant="subtitle" className="mt-2">
          This campaign doesn&apos;t exist, or you don&apos;t have access to it.
        </Typography>
        <Link href="/campaigns" className={cn("mt-6", buttonVariants())}>
          Back to campaigns
        </Link>
      </div>
    );
  }

  const { role, isAdmin } = campaign;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/campaigns"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Campaigns
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="h1">{campaign.name}</Typography>
          <Typography
            variant="subtitle"
            className="mt-3 max-w-2xl whitespace-pre-line"
          >
            {campaign.description || "No description yet."}
          </Typography>
        </div>
        {role && (
          <Chip variant="neutral" className="uppercase tracking-wide">
            {role === "dm" ? "DM" : "Player"}
          </Chip>
        )}
      </header>

      {isAdmin && (
        <div className="mt-10">
          <CampaignSettings
            campaignId={campaign.id}
            initialName={campaign.name}
            initialDescription={campaign.description}
          />
        </div>
      )}
    </div>
  );
}
