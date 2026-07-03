import Link from "next/link";
import { NotesSidebar } from "@/components/wiki/NotesSidebar";
import { PageEditorPanel } from "@/components/wiki/PageEditorPanel";
import type { NoteScope } from "@/app/actions/categories";
import type { NotePage, NoteTree } from "@/lib/queries/notes";
import { Chip, Typography, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";

// Upcoming campaign tools; rendered as a compact strip under the header until
// each one is actually built.
const UPCOMING_TOOLS = [
  "Combat tracker",
  "Inventory log",
  "Character sheets",
  "Handouts & files",
  "Members & invites",
];

export function CampaignWorkspace({
  campaignId,
  name,
  description,
  role,
  isAdmin,
  publicCode,
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
  tree: NoteTree;
  activeTab: NoteScope;
  selectedPage: NotePage | null;
  canEditSelected: boolean;
}) {
  const treeHasPages =
    tree.rootPages.length > 0 ||
    tree.categories.some((c) => c.pages.length > 0);

  return (
    <div id="campaign-workspace" className="app-container py-6">

      <header id="campaign-header" className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-accent-700 via-accent-600 to-accent-500 px-6 py-8 text-white md:px-8">
          <div className="flex flex-wrap items-start gap-5">
            {/* Large basis: when the description needs the room, the button
                group wraps below instead of squeezing the text. */}
            <div className="min-w-0 flex-1 basis-[32rem]">
              <div className="flex flex-wrap items-center gap-2">
                {role && (
                  <Chip variant="onDark" className="uppercase tracking-wide">
                    {role === "dm" ? "DM" : "Player"}
                  </Chip>
                )}
                <Chip variant="onDarkSolid">Campaign workspace</Chip>
                            <div id="campaign-actions" className="ml-auto flex flex-wrap gap-2">
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

        <div id="campaign-tools" className="flex flex-wrap items-center gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3 md:px-8">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-gray-500">
            Tools
          </span>
          <span id="campaign-tool-notes" className="inline-flex items-center gap-1.5 rounded-full bg-accent-600 px-3 py-1 text-xs font-medium text-white">
            Notes
          </span>
          {UPCOMING_TOOLS.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-400"
            >
              {tool}
            </span>
          ))}
        </div>
      </header>

      {/* Navigator and content share one card: the sidebar selects what the
          main pane shows, so they read as a single connected surface. */}
      <section id="campaign-body" className="mt-6 grid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[17rem_minmax(0,1fr)]">
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
      </section>
    </div>
  );
}
