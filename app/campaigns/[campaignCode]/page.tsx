import Link from "next/link";
import { CampaignWorkspace } from "@/components/campaigns/CampaignWorkspace";
import { Typography, buttonVariants } from "@/components/ui";
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

  return (
    <CampaignWorkspace
      name={campaign.name}
      description={campaign.description}
      role={campaign.role}
      isAdmin={campaign.isAdmin}
      publicCode={campaign.publicCode}
    />
  );
}
