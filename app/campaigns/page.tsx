import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { NewCampaignButton } from "@/components/campaigns/NewCampaignButton";
import { DemoSection } from "@/components/campaigns/DemoSection";
import { CampaignsPageHeaderBrowse, CampaignsPageHeaderOwned } from "@/components/campaigns/CampaignsPageHeader";
import { CampaignsEmptyState } from "@/components/campaigns/CampaignsEmptyState";
import { SignInLink } from "@/components/campaigns/SignInLink";
import { DEMO_CAMPAIGNS } from "@/data/demo-campaigns";
import { getCampaignsForCurrentUser } from "@/lib/queries/campaigns";

export default async function CampaignsPage() {
  const { isSignedIn, campaigns } = await getCampaignsForCurrentUser();

  // Logged-out: browse demo content with a sign-in CTA.
  if (!isSignedIn) {
    return (
      <div id="campaigns-page" className="app-container py-10">
        <div id="campaigns-header" className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <CampaignsPageHeaderBrowse />
          <SignInLink />
        </div>

        <div id="campaigns-list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_CAMPAIGNS.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="campaigns-page" className="app-container py-6">
      <div id="campaigns-header" className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <CampaignsPageHeaderOwned />
        <NewCampaignButton />
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <CampaignsEmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}

      <DemoSection />
    </div>
  );
}
