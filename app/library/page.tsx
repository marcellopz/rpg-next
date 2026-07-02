import Link from "next/link";
import type { ReactNode } from "react";

type Kind = "Character" | "Item" | "Spell" | "Note" | "Map" | "Monster";

function KindIcon({ kind }: { kind: Kind }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
  };
  switch (kind) {
    case "Character":
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        </svg>
      );
    case "Item":
      return (
        <svg {...common}>
          <path d="m21 8-9-5-9 5v8l9 5 9-5z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      );
    case "Spell":
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "Note":
      return (
        <svg {...common}>
          <path d="M4 4h11l5 5v11a0 0 0 0 1 0 0H4z" />
          <path d="M15 4v5h5M8 13h8M8 17h6" />
        </svg>
      );
    case "Map":
      return (
        <svg {...common}>
          <path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      );
    case "Monster":
      return (
        <svg {...common}>
          <path d="M4 10a8 8 0 0 1 16 0v6a3 3 0 0 1-3 3l-1-2-2 2-2-2-2 2-1-2a3 3 0 0 1-3-3z" />
          <path d="M9 10h.01M15 10h.01" />
        </svg>
      );
  }
}

type DemoItem = {
  id: string;
  title: string;
  kind: Kind;
  blurb: string;
  tags: string[];
};

const DEMO_ITEMS: DemoItem[] = [
  {
    id: "1",
    title: "Brannoc Stoneward",
    kind: "Character",
    blurb: "Dwarven cleric of the forge. A reusable NPC ally for any frontier town.",
    tags: ["NPC", "Cleric"],
  },
  {
    id: "2",
    title: "Lantern of the Drowned",
    kind: "Item",
    blurb: "A green-flamed lantern that reveals what the tide took. Cursed, naturally.",
    tags: ["Magic item", "Cursed"],
  },
  {
    id: "3",
    title: "Hollow Step",
    kind: "Spell",
    blurb: "Move silently through any surface you've touched in the last minute.",
    tags: ["Homebrew", "Level 2"],
  },
  {
    id: "4",
    title: "The Saltveil Accord",
    kind: "Note",
    blurb: "Lore dump on the pirate truce that holds the western archipelago together.",
    tags: ["Lore", "Factions"],
  },
  {
    id: "5",
    title: "Eldermoor Keep — Ground Floor",
    kind: "Map",
    blurb: "Battle-ready grid map of a ruined keep. Drop it into any dungeon crawl.",
    tags: ["Battle map", "Dungeon"],
  },
  {
    id: "6",
    title: "Gloamhound",
    kind: "Monster",
    blurb: "Pack hunter that feeds on light. CR 3, scales cleanly to a swarm encounter.",
    tags: ["CR 3", "Beast"],
  },
  {
    id: "7",
    title: "Vesper Quill",
    kind: "Character",
    blurb: "Tiefling spy with a ledger of everyone's secrets. Plug-and-play intrigue.",
    tags: ["NPC", "Rogue"],
  },
  {
    id: "8",
    title: "Writ of Passage",
    kind: "Item",
    blurb: "A forged noble seal that opens doors — until someone checks it twice.",
    tags: ["Plot hook", "Mundane"],
  },
];

const FILTERS: Array<Kind | "All"> = [
  "All",
  "Character",
  "Item",
  "Spell",
  "Note",
  "Map",
  "Monster",
];

function KindCard({ item }: { item: DemoItem }): ReactNode {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <KindIcon kind={item.kind} />
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
          {item.kind}
        </span>
      </div>
      <h3 className="mt-4 font-semibold">{item.title}</h3>
      <p className="mt-1 flex-1 text-sm text-gray-600">{item.blurb}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((t) => (
          <span
            key={t}
            className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-500 ring-1 ring-inset ring-gray-200"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <div id="library-page" className="app-container py-10">
      <div id="library-header" className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Personal library</h1>
          <p className="mt-1 text-gray-600">
            Your cross-campaign collection — characters, items, and lore you can
            drop into any table.
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-500"
        >
          Add to library
        </Link>
      </div>

      <div id="library-filters" className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={
              i === 0
                ? "rounded-full bg-accent-600 px-3.5 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900"
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div id="library-grid" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_ITEMS.map((item) => (
          <KindCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
