import Link from "next/link";
import { CampaignWorkspace } from "@/components/campaigns/CampaignWorkspace";
import { parseCampaignTool } from "@/components/campaigns/campaign-tools";
import { Typography, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DEMO_CAMPAIGN_CODE, getDemoCampaign } from "@/data/demo-campaign";
import {
  getCampaignDetailForCurrentUser,
  getCurrentUserId,
} from "@/lib/queries/campaigns";
import {
  getInventoryForCampaign,
  getInventoryLog,
  type Character,
  type InventoryLogEntry,
} from "@/lib/queries/inventory";
import {
  EMPTY_LAYOUTS,
  getInventoryCharacterOptions,
  getResourcesForCampaign,
  type ResourcesDashboard,
  type InventoryCharacterOption,
} from "@/lib/queries/resources";
import { getCombatForCampaign } from "@/lib/queries/combat";
import type { CombatState } from "@/lib/combat/types";
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
  searchParams: { tab?: string; page?: string; tool?: string; character?: string };
}) {
  const isDemo = params.campaignCode === DEMO_CAMPAIGN_CODE;

  const campaign = isDemo
    ? getDemoCampaign().detail
    : await getCampaignDetailForCurrentUser(params.campaignCode);

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
  const userId = isDemo ? null : await getCurrentUserId();

  let tree: NoteTree = EMPTY_TREE;
  let activeTab: "campaign" | "personal" = "campaign";
  let selectedPage: NotePage | null = null;
  let characters: Character[] = [];
  let inventoryLog: InventoryLogEntry[] = [];
  let selectedCharacterId: string | null = null;
  let resources: ResourcesDashboard = { cards: [], layouts: EMPTY_LAYOUTS };
  let inventoryCharacterOptions: InventoryCharacterOption[] = [];

  // Kick off the combat fetch now and await it after the tool-specific
  // queries so it doesn't add a round trip to every render.
  const combatPromise: Promise<CombatState | null> = isDemo
    ? Promise.resolve(getDemoCampaign().combat)
    : getCombatForCampaign(campaign.id);

  if (activeTool === "notes") {
    activeTab = searchParams.tab === "my" ? "personal" : "campaign";

    if (isDemo) {
      tree = getDemoCampaign().noteTrees[activeTab];
      const fallbackId = searchParams.page ?? defaultPageId(tree);
      selectedPage = fallbackId ? getDemoCampaign().pageById(fallbackId) : null;
    } else {
      // When the URL names a page, fetch it in parallel with the trees; only
      // fall back to a second round trip when we need the tree to pick a default.
      const [trees, pageFromUrl] = await Promise.all([
        getNoteTreesForCampaign(campaign.id),
        searchParams.page ? getPageForCurrentUser(searchParams.page) : null,
      ]);
      tree = trees[activeTab];

      let page = pageFromUrl;
      if (!page) {
        const fallbackId = defaultPageId(tree);
        if (fallbackId) page = await getPageForCurrentUser(fallbackId);
      }
      if (page && page.campaignId === campaign.id) selectedPage = page;
    }
  }

  if (activeTool === "inventory") {
    if (isDemo) {
      characters = getDemoCampaign().characters;
      inventoryLog = getDemoCampaign().inventoryLog;
    } else {
      [characters, inventoryLog] = await Promise.all([
        getInventoryForCampaign(campaign.id),
        getInventoryLog(campaign.id),
      ]);
    }
    selectedCharacterId =
      characters.find((c) => c.id === searchParams.character)?.id ??
      characters[0]?.id ??
      null;
  }

  if (activeTool === "resources") {
    if (isDemo) {
      resources = getDemoCampaign().resources;
      inventoryCharacterOptions = getDemoCampaign().characters.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    } else {
      [resources, inventoryCharacterOptions] = await Promise.all([
        getResourcesForCampaign(campaign.id),
        getInventoryCharacterOptions(campaign.id),
      ]);
    }
  }

  const combat = await combatPromise;

  return (
    <CampaignWorkspace
      campaignId={campaign.id}
      name={campaign.name}
      description={campaign.description}
      role={campaign.role}
      isAdmin={campaign.isAdmin}
      isDm={campaign.isDm}
      publicCode={campaign.publicCode}
      imageUrl={campaign.imageUrl}
      activeTool={activeTool}
      tree={tree}
      activeTab={activeTab}
      selectedPage={selectedPage}
      characters={characters}
      inventoryLog={inventoryLog}
      selectedCharacterId={selectedCharacterId}
      resources={resources}
      inventoryCharacterOptions={inventoryCharacterOptions}
      combat={combat}
      readOnly={isDemo}
      canEditSelected={
        !isDemo &&
        !!selectedPage &&
        (selectedPage.visibility === "public" || selectedPage.ownerId === userId)
      }
    />
  );
}
