import Link from "next/link";
import { CampaignToolCard } from "@/components/campaigns/CampaignToolCard";
import { Chip, Typography, buttonVariants } from "@/components/ui";
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

const TOOL_CARDS = [
  {
    title: "Combat tracker",
    description: "Initiative, rounds, HP, conditions, and DM notes.",
  },
  {
    title: "Inventory log",
    description: "Party treasure, item changes, and character backpacks.",
  },
  {
    title: "Character sheets",
    description: "Player-facing sheets connected to campaign notes.",
  },
  {
    title: "Handouts and files",
    description: "Images, PDFs, maps, and private DM uploads.",
  },
  {
    title: "Members and invites",
    description: "Invite players and review campaign access.",
  },
  {
    title: "TV display",
    description: "Read-only campaign surface for the living-room screen.",
  },
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
    <div className="app-container py-6">

      <header className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-accent-700 via-accent-600 to-accent-500 px-6 py-8 text-white md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                {role && (
                  <Chip variant="onDark" className="uppercase tracking-wide">
                    {role === "dm" ? "DM" : "Player"}
                  </Chip>
                )}
                <Chip variant="onDarkSolid">Campaign workspace</Chip>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {name}
              </h1>
              <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-white/80 md:text-base">
                {description || "No description yet."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
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
        </div>

        <div className="grid gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm md:grid-cols-3 md:px-8">
          <div>
            <span className="font-medium text-gray-900">Primary tool</span>
            <p className="mt-1 text-gray-600">Structured campaign notes</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Current phase</span>
            <p className="mt-1 text-gray-600">Layout placeholders</p>
          </div>
          <div>
            <span className="font-medium text-gray-900">Campaign code</span>
            <p className="mt-1 font-mono text-gray-600">{publicCode}</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-medium">
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

          <div className="mt-4 space-y-4">
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
                          ? "bg-gray-100 text-gray-900"
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

          <div className="mt-5 grid gap-2">
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

        <main className="min-h-[42rem] rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <div>
              <Typography variant="h2">Campaign primer</Typography>
              <Typography variant="muted" className="mt-1">
                Main note-taking surface placeholder.
              </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Save", "History", "Formatting", "Find"].map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
              <Chip variant="accent">First tool to build</Chip>
              <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                Notes belong here
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                This space will become the rich text campaign notebook: public
                pages, private player notes, categories, page history, autosave,
                and recovery. For now it shows the intended hierarchy and
                editor footprint without persisting note content.
              </p>

              <div className="mt-6 space-y-3 rounded-xl bg-white p-5 text-sm text-gray-600 shadow-sm">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-5/6 rounded bg-gray-100" />
                <div className="h-24 rounded-lg border border-gray-200 bg-gray-50" />
                <div className="h-4 w-3/4 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        </main>

        <aside className="space-y-4">
          <CampaignToolCard
            title="Notes"
            description="Categories, pages, private notes, search, and recovery."
            status="Primary"
          />
          {TOOL_CARDS.map((tool) => (
            <CampaignToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
            />
          ))}
        </aside>
      </section>
    </div>
  );
}
