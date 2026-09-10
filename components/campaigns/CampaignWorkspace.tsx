"use client";

import Image from "next/image";
import { NavLink } from "@/components/navigation/NavLink";
import { useI18n } from "@/lib/i18n/context";
import { NotesSidebar } from "@/components/notes-navigator/NotesSidebar";
import { PageEditorPanel } from "@/components/notes-editor/PageEditorPanel";
import { CampaignToolTabs } from "@/components/campaigns/CampaignToolTabs";
import {
  CAMPAIGN_TOOLS,
  type CampaignToolId,
} from "@/components/campaigns/campaign-tools";
import { ToolPlaceholder } from "@/components/campaigns/ToolPlaceholder";
import { AllowRemoteDisplayToggle } from "@/components/handouts/AllowRemoteDisplayToggle";
import { HandoutBroadcastModal } from "@/components/handouts/HandoutBroadcastModal";
import { HandoutBroadcastProvider } from "@/components/handouts/HandoutBroadcastContext";
import { HandoutsTool } from "@/components/handouts/HandoutsTool";
import { InventoryTool } from "@/components/inventory/InventoryTool";
import { MapTool } from "@/components/map/MapTool";
import { ResourcesTool } from "@/components/resources/ResourcesTool";
import type { NoteScope } from "@/app/actions/categories";
import type { Character, InventoryLogEntry } from "@/lib/queries/inventory";
import type { NotePage, NoteTree } from "@/lib/queries/notes";
import type {
  InventoryCharacterOption,
  ResourcesDashboard,
} from "@/lib/queries/resources";
import { CombatTrackerLauncher } from "@/components/combat/CombatTrackerLauncher";
import type { CombatState } from "@/lib/combat/types";
import { CampaignSearchButton } from "@/components/campaigns/CampaignSearchButton";
import {
  DemoSandboxProvider,
  useOptionalDemoSandbox,
} from "@/components/campaigns/DemoSandboxProvider";
import { AlertTriangle } from "lucide-react";
import { Chip, Typography, buttonVariants } from "@/components/ui";
import { accentHatchStyle } from "@/lib/ui/accent-hatch";
import { isDemoCampaignId } from "@/data/demo-campaign";

export function CampaignWorkspace({
  campaignId,
  name,
  description,
  role,
  isAdmin,
  isDm,
  publicCode,
  imageUrl,
  activeTool,
  tree,
  activeTab,
  selectedPage,
  canEditSelected,
  selectedPageId,
  characters,
  inventoryLog,
  selectedCharacterId,
  resources,
  inventoryCharacterOptions,
  combat,
  readOnly,
  initialMapPinId,
}: {
  campaignId: string;
  name: string;
  description: string;
  role: "dm" | "player" | null;
  isAdmin: boolean;
  isDm: boolean;
  publicCode: string;
  imageUrl: string | null;
  activeTool: CampaignToolId;
  tree: NoteTree;
  activeTab: NoteScope;
  selectedPage: NotePage | null;
  selectedPageId: string | null;
  canEditSelected: boolean;
  characters: Character[];
  inventoryLog: InventoryLogEntry[];
  selectedCharacterId: string | null;
  resources: ResourcesDashboard;
  inventoryCharacterOptions: InventoryCharacterOption[];
  combat: CombatState | null;
  readOnly: boolean;
  /** A pin id from a `?pin=` deep link (e.g. a note's "linked pins" jump). */
  initialMapPinId: string | null;
}) {
  const isDemo = isDemoCampaignId(campaignId);
  const body = <CampaignWorkspaceBody {...{
    campaignId,
    name,
    description,
    role,
    isAdmin,
    isDm,
    publicCode,
    imageUrl,
    activeTool,
    tree,
    activeTab,
    selectedPage,
    selectedPageId,
    canEditSelected,
    characters,
    inventoryLog,
    selectedCharacterId,
    resources,
    inventoryCharacterOptions,
    combat,
    readOnly,
    initialMapPinId,
  }} />;

  if (!isDemo) return body;
  return <DemoSandboxProvider>{body}</DemoSandboxProvider>;
}

function CampaignWorkspaceBody({
  campaignId,
  name,
  description,
  role,
  isAdmin,
  isDm,
  publicCode,
  imageUrl,
  activeTool,
  tree,
  activeTab,
  selectedPage,
  selectedPageId,
  canEditSelected,
  characters,
  inventoryLog,
  selectedCharacterId,
  resources,
  inventoryCharacterOptions,
  combat,
  readOnly,
  initialMapPinId,
}: {
  campaignId: string;
  name: string;
  description: string;
  role: "dm" | "player" | null;
  isAdmin: boolean;
  isDm: boolean;
  publicCode: string;
  imageUrl: string | null;
  activeTool: CampaignToolId;
  tree: NoteTree;
  activeTab: NoteScope;
  selectedPage: NotePage | null;
  selectedPageId: string | null;
  canEditSelected: boolean;
  characters: Character[];
  inventoryLog: InventoryLogEntry[];
  selectedCharacterId: string | null;
  resources: ResourcesDashboard;
  inventoryCharacterOptions: InventoryCharacterOption[];
  combat: CombatState | null;
  readOnly: boolean;
  initialMapPinId: string | null;
}) {
  const { t } = useI18n();
  const sandbox = useOptionalDemoSandbox();
  const isDemo = !!sandbox;
  const liveTree = sandbox?.noteTrees[activeTab] ?? tree;
  const pageId = selectedPageId ?? selectedPage?.id ?? null;
  const livePage =
    (pageId ? sandbox?.pagesById[pageId] : undefined) ?? selectedPage;
  const liveCharacters = sandbox?.characters ?? characters;
  const liveCombat = sandbox?.combat ?? combat;
  const toolsLocked = isDemo;
  const treeHasPages =
    liveTree.rootPages.length > 0 ||
    liveTree.categories.some((c) => c.pages.length > 0);

  const toolMeta = CAMPAIGN_TOOLS.find((t) => t.id === activeTool)!;

  function getToolPlaceholderLabel(toolId: CampaignToolId): string {
    const labels: Record<CampaignToolId, string> = {
      notes: t("tools.notes"),
      inventory: t("tools.inventory"),
      map: t("tools.map"),
      resources: t("tools.resources"),
      handouts: t("tools.handouts"),
    };
    return labels[toolId];
  }

  return (
    <HandoutBroadcastProvider campaignId={campaignId}>
      <div id="campaign-workspace" className="app-container py-6">
        <HandoutBroadcastModal />
        {toolsLocked && (
          <div
            id="campaign-demo-notice"
            role="status"
            className="mb-4 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950"
          >
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden
            />
            <Typography
              variant="body"
              className="font-medium text-amber-950"
            >
              {t("campaigns.demoReadOnly")}
            </Typography>
          </div>
        )}
        <header
          id="campaign-header"
          className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
        >
          <div
            className="relative bg-accent-800 px-6 py-8 text-white md:px-8"
            style={imageUrl ? undefined : accentHatchStyle}
          >
            {imageUrl && (
              <>
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  sizes="100vw"
                  priority
                  className="object-cover"
                />
                {/* Darkening overlay keeps the white header text legible. */}
                <div
                  className="absolute inset-0 bg-black/55"
                  aria-hidden="true"
                />
              </>
            )}
            <div className="relative flex flex-wrap items-start gap-5">
              <div className="min-w-0 flex-1 basis-[32rem]">
                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && (
                    <Chip
                      variant="onDarkSolid"
                      className="uppercase tracking-wide"
                    >
                      {t("campaign.admin")}
                    </Chip>
                  )}
                  {isDm && (
                    <Chip variant="onDark" className="uppercase tracking-wide">
                      {t("campaign.dm")}
                    </Chip>
                  )}
                  {!isAdmin && !isDm && role === "player" && (
                    <Chip variant="onDark" className="uppercase tracking-wide">
                      {t("campaign.player")}
                    </Chip>
                  )}
                  <Chip variant="onDarkSolid">{t("campaign.workspace")}</Chip>
                  <div
                    id="campaign-actions"
                    className="ml-auto flex flex-wrap items-center gap-2"
                  >
                    <CombatTrackerLauncher
                      campaignId={campaignId}
                      isDm={sandbox ? sandbox.combatIsDm : isDm}
                      combat={liveCombat}
                      readOnly={readOnly && !isDemo}
                    />
                    <CampaignSearchButton
                      campaignId={campaignId}
                      publicCode={publicCode}
                    />
                    {isAdmin && (
                      <NavLink
                        href={`/campaigns/${publicCode}/settings#campaign-settings-members`}
                        className={buttonVariants({
                          variant: "white",
                          size: "sm",
                        })}
                      >
                        {t("campaign.invite")}
                      </NavLink>
                    )}
                    {isAdmin && (
                      <NavLink
                        href={`/campaigns/${publicCode}/settings`}
                        className={buttonVariants({
                          variant: "white",
                          size: "sm",
                        })}
                      >
                        {t("campaign.settings")}
                      </NavLink>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <h1
                    id="campaign-title"
                    className="mt-2 text-3xl font-bold tracking-tight"
                  >
                    {name}
                  </h1>
                  <AllowRemoteDisplayToggle />
                </div>
                <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 line-clamp-2 text-white/80 md:text-base">
                  {description || t("campaign.noDescription")}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section
          id="campaign-body"
          className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <CampaignToolTabs
            publicCode={publicCode}
            activeTool={activeTool}
            notesTab={activeTab}
            selectedPageId={pageId}
          />

          {activeTool === "notes" ? (
            <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
              <aside
                id="campaign-sidebar"
                className="border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r"
              >
                <NotesSidebar
                  campaignId={campaignId}
                  publicCode={publicCode}
                  tree={liveTree}
                  activeTab={activeTab}
                  selectedPageId={pageId}
                  readOnly={readOnly && !isDemo}
                />
              </aside>

              <main
                id="campaign-editor"
                className="flex min-h-[42rem] flex-col bg-white"
              >
                <div
                  id="campaign-editor-content"
                  className="flex min-h-0 flex-1 flex-col"
                >
                  {livePage ? (
                    // Keyed by page id so the panel remounts with fresh state on
                    // page switch — reusing the instance leaks the previous
                    // page's document into the new page's editor.
                    <PageEditorPanel
                      key={livePage.id}
                      page={livePage}
                      canEdit={isDemo || canEditSelected}
                      publicCode={publicCode}
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-center">
                      <div className="max-w-sm">
                        <Typography variant="h3" as="h2">
                          {treeHasPages
                            ? t("notes.selectPage")
                            : t("notes.empty")}
                        </Typography>
                        <Typography variant="muted" className="mt-2 leading-6">
                          {treeHasPages
                            ? t("notes.selectPageDesc")
                            : t("notes.emptyDesc")}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </div>
          ) : activeTool === "inventory" ? (
            <InventoryTool
              campaignId={campaignId}
              publicCode={publicCode}
              characters={liveCharacters}
              selectedCharacterId={
                liveCharacters.find((c) => c.id === selectedCharacterId)?.id ??
                liveCharacters[0]?.id ??
                null
              }
              log={inventoryLog}
              readOnly={readOnly && !isDemo}
            />
          ) : activeTool === "map" ? (
          <MapTool
            campaignId={campaignId}
            publicCode={publicCode}
            readOnly={readOnly}
            initialPinId={initialMapPinId}
          />
        ) : activeTool === "resources" ? (
            <ResourcesTool
              campaignId={campaignId}
              dashboard={resources}
              inventoryCharacters={inventoryCharacterOptions}
              readOnly={readOnly}
            />
          ) : activeTool === "handouts" ? (
            <HandoutsTool
              campaignId={campaignId}
              isAdmin={isAdmin}
              readOnly={readOnly}
            />
          ) : (
            <ToolPlaceholder
              title={getToolPlaceholderLabel(activeTool)}
              description={toolMeta.placeholder}
            />
          )}
        </section>
      </div>
    </HandoutBroadcastProvider>
  );
}
