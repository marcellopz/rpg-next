import Link from "next/link";
import { NotesSidebar } from "@/components/notes-navigator/NotesSidebar";
import { PageEditorPanel } from "@/components/notes-editor/PageEditorPanel";
import { CampaignToolTabs } from "@/components/campaigns/CampaignToolTabs";
import {
  CAMPAIGN_TOOLS,
  type CampaignToolId,
} from "@/components/campaigns/campaign-tools";
import { ToolPlaceholder } from "@/components/campaigns/ToolPlaceholder";
import type { NoteScope } from "@/app/actions/categories";
import type { NotePage, NoteTree } from "@/lib/queries/notes";
import { Chip, Typography, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";

export function CampaignWorkspace({
  campaignId,
  name,
  description,
  role,
  isAdmin,
  publicCode,
  activeTool,
  tree,
  activeTab,
  selectedPage,
  canEditSelected,
}: {
  campaignId: string;
  name: string;
  description: string;
  role: "dm" | "player" | null;
  isAdmin: boolean;
  publicCode: string;
  activeTool: CampaignToolId;
  tree: NoteTree;
  activeTab: NoteScope;
  selectedPage: NotePage | null;
  canEditSelected: boolean;
}) {
  const treeHasPages =
    tree.rootPages.length > 0 ||
    tree.categories.some((c) => c.pages.length > 0);

  const toolMeta = CAMPAIGN_TOOLS.find((t) => t.id === activeTool)!;

  return (
    <div id="campaign-workspace" className="app-container py-6">
      <header id="campaign-header" className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-accent-700 via-accent-600 to-accent-500 px-6 py-8 text-white md:px-8">
          <div className="flex flex-wrap items-start gap-5">
            <div className="min-w-0 flex-1 basis-[32rem]">
              <div className="flex flex-wrap items-center gap-2">
                {role && (
                  <Chip variant="onDark" className="uppercase tracking-wide">
                    {role === "dm" ? "DM" : "Player"}
                  </Chip>
                )}
                <Chip variant="onDarkSolid">Campaign workspace</Chip>
                <div id="campaign-actions" className="ml-auto flex flex-wrap gap-2">
                  <Link
                    href={`/campaigns/${publicCode}?tool=combat`}
                    className={cn(
                      buttonVariants({ variant: "white", size: "md" }),
                      "font-semibold shadow-lg shadow-black/10"
                    )}
                  >
                    Combat tracker
                  </Link>
                  <button
                    type="button"
                    disabled
                    className={cn(
                      buttonVariants({ variant: "white", size: "sm" }),
                      "opacity-80"
                    )}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    disabled
                    className={cn(
                      buttonVariants({ variant: "white", size: "sm" }),
                      "opacity-80"
                    )}
                  >
                    Invite
                  </button>
                  <Link
                    href={`/tv/${publicCode}`}
                    className={buttonVariants({ variant: "white", size: "sm" })}
                  >
                    TV display
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/campaigns/${publicCode}/settings`}
                      className={buttonVariants({ variant: "white", size: "sm" })}
                    >
                      Settings
                    </Link>
                  )}
                </div>
              </div>
              <h1 id="campaign-title" className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {name}
              </h1>
              <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 line-clamp-2 text-white/80 md:text-base">
                {description || "No description yet."}
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
          selectedPageId={selectedPage?.id ?? null}
        />

        {activeTool === "notes" ? (
          <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
            <aside id="campaign-sidebar" className="border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r">
              <NotesSidebar
                campaignId={campaignId}
                publicCode={publicCode}
                tree={tree}
                activeTab={activeTab}
                selectedPageId={selectedPage?.id ?? null}
              />
            </aside>

            <main id="campaign-editor" className="flex min-h-[42rem] flex-col bg-white">
              <div id="campaign-editor-content" className="flex min-h-0 flex-1 flex-col">
                {selectedPage ? (
                  <PageEditorPanel page={selectedPage} canEdit={canEditSelected} />
                ) : (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div className="max-w-sm">
                      <Typography variant="h3" as="h2">
                        {treeHasPages ? "Select a page" : "No pages yet"}
                      </Typography>
                      <Typography variant="muted" className="mt-2 leading-6">
                        {treeHasPages
                          ? "Pick a page from the navigator to start reading or writing."
                          : "Create your first page in the navigator to start taking notes."}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        ) : (
          <ToolPlaceholder
            title={toolMeta.label}
            description={toolMeta.placeholder}
          />
        )}
      </section>
    </div>
  );
}
