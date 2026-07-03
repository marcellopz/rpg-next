import Link from "next/link";
import type { JSONContent } from "@tiptap/core";
import { PageEditor } from "@/components/editor/PageEditor";
import { Chip, buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";

const NOTE_CATEGORIES = [
  {
    name: "World",
    pages: ["Campaign primer", "Factions", "Timeline"],
  },
  {
    name: "Sessions",
    pages: ["Session 1 recap", "Loose threads", "Next prep"],
  },
  {
    name: "NPCs",
    pages: ["Allies", "Rivals", "Mystery contacts"],
  },
  {
    name: "Locations",
    pages: ["Capital city", "The old road", "Hidden sanctum"],
  },
];

// Demo document for the selected page. Editing works fully in the browser;
// persistence to Supabase comes with the wiki feature.
const DEMO_PAGE_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Campaign primer" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Welcome to the campaign notebook. This editor already supports rich text — try the toolbar above or keyboard shortcuts like ",
        },
        { type: "text", marks: [{ type: "code" }], text: "Ctrl+B" },
        { type: "text", text: " and " },
        { type: "text", marks: [{ type: "code" }], text: "Ctrl+I" },
        { type: "text", text: "." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "The setup" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "The frontier town of Eldermoor has gone quiet. The last caravan returned with empty wagons and emptier stares. The party is hired to find out why.",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Hook: " },
                {
                  type: "text",
                  text: "a letter from the mayor, sealed with wax that smells of ash.",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Stakes: " },
                {
                  type: "text",
                  text: "the harvest festival is in ten days — and the road must be open by then.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "\u201cNothing leaves Eldermoor anymore. Not goods, not letters, not people.\u201d — Mayor Hesta",
            },
          ],
        },
      ],
    },
  ],
};

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
  name,
  description,
  role,
  isAdmin,
  publicCode,
}: {
  name: string;
  description: string;
  role: "dm" | "player" | null;
  isAdmin: boolean;
  publicCode: string;
}) {
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
          <div id="campaign-notes-tabs" className="flex rounded-xl bg-gray-100 p-1 text-xs font-medium">
            <button
              type="button"
              className="flex-1 rounded-lg bg-white px-3 py-2 text-gray-900 shadow-sm"
            >
              Campaign notes
            </button>
            <button
              type="button"
              disabled
              className="flex-1 px-3 py-2 text-gray-500"
            >
              My notes
            </button>
          </div>

          <div id="campaign-category-tree" className="mt-4 space-y-4">
            {NOTE_CATEGORIES.map((category, index) => (
              <div key={category.name}>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold",
                    index === 0
                      ? "bg-accent-50 text-accent-800"
                      : "text-gray-700"
                  )}
                >
                  {category.name}
                </div>
                <div className="mt-1 space-y-1 pl-3">
                  {category.pages.map((page, pageIndex) => (
                    <button
                      key={page}
                      type="button"
                      disabled
                      className={cn(
                        "block w-full rounded-md px-3 py-2 text-left text-sm",
                        index === 0 && pageIndex === 0
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div id="campaign-sidebar-actions" className="mt-5 grid gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500"
            >
              New category - coming soon
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500"
            >
              New page - coming soon
            </button>
          </div>
        </aside>

        <main id="campaign-editor" className="flex min-h-[42rem] flex-col bg-white">
          <div id="campaign-editor-content" className="flex min-h-0 flex-1 flex-col">
            <PageEditor initialContent={DEMO_PAGE_CONTENT} />
          </div>
        </main>
      </section>
    </div>
  );
}
