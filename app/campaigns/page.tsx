import Link from "next/link";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { NewCampaignButton } from "@/components/campaigns/NewCampaignButton";
import { Typography, buttonVariants } from "@/components/ui";
import { DEMO_CAMPAIGNS } from "@/data/demo-campaigns";
import { getCampaignsForCurrentUser } from "@/lib/queries/campaigns";

function DemoSection() {
  return (
    <div className="mt-14">
      <Typography variant="h3" as="h2">
        Demo campaigns
      </Typography>
      <Typography variant="subtitle" className="mt-1 text-sm">
        A few examples to explore. These aren&apos;t part of your account.
      </Typography>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_CAMPAIGNS.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}

export default async function CampaignsPage() {
  const { isSignedIn, campaigns } = await getCampaignsForCurrentUser();

  // Logged-out: browse demo content with a sign-in CTA.
  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Typography variant="h1">Campaigns</Typography>
            <Typography variant="subtitle" className="mt-1">
              A peek at what your table could look like. Sign in to start your
              own.
            </Typography>
          </div>
          <Link href="/login" className={buttonVariants()}>
            Sign in
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_CAMPAIGNS.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Typography variant="h1">Campaigns</Typography>
          <Typography variant="subtitle" className="mt-1">
            Pick up where your table left off, or start something new.
          </Typography>
        </div>
        <NewCampaignButton />
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Typography variant="h3">No campaigns yet</Typography>
          <Typography variant="subtitle" className="mx-auto mt-1 max-w-sm text-sm">
            Create your first campaign to start building your world, your party,
            and your story.
          </Typography>
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
