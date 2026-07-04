import Link from "next/link";
import { CampaignWorkspace } from "@/components/campaigns/CampaignWorkspace";
import { parseCampaignTool } from "@/components/campaigns/campaign-tools";
import { Typography, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  getCampaignDetailForCurrentUser,
  getCurrentUserId,
} from "@/lib/queries/campaigns";
import {
  getNoteTreesForCampaign,
  getPageForCurrentUser,
  type NotePage,
  type NoteTree,
} from "@/lib/queries/notes";

const EMPTY_TREE: NoteTree = { categories: [], rootPages: [] };

// The first page in tree order: first category with pages wins, then root.
function defaultPageId(tree: NoteTree): string | null {
  for (const category of tree.categories) {
    if (category.pages.length > 0) return category.pages[0].id;
  }
  return tree.rootPages[0]?.id ?? null;
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: { campaignCode: string };
  searchParams: { tab?: string; page?: string; tool?: string };
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

  const activeTool = parseCampaignTool(searchParams.tool);
  const userId = await getCurrentUserId();

  let tree: NoteTree = EMPTY_TREE;
  let activeTab: "campaign" | "personal" = "campaign";
  let selectedPage: NotePage | null = null;

  if (activeTool === "notes") {
    const trees = await getNoteTreesForCampaign(campaign.id);
    activeTab = searchParams.tab === "my" ? "personal" : "campaign";
    tree = trees[activeTab];

    const selectedPageId = searchParams.page ?? defaultPageId(tree);
    if (selectedPageId) {
      const page = await getPageForCurrentUser(selectedPageId);
      if (page && page.campaignId === campaign.id) selectedPage = page;
    }
  }

  return (
    <CampaignWorkspace
      campaignId={campaign.id}
      name={campaign.name}
      description={campaign.description}
      role={campaign.role}
      isAdmin={campaign.isAdmin}
      publicCode={campaign.publicCode}
      activeTool={activeTool}
      tree={tree}
      activeTab={activeTab}
      selectedPage={selectedPage}
      canEditSelected={
        !!selectedPage &&
        (selectedPage.visibility === "public" || selectedPage.ownerId === userId)
      }
    />
  );
}
