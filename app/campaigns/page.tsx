import Link from "next/link";
import { CampaignCard, type Campaign } from "@/components/CampaignCard";

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "shadows-of-eldermoor",
    name: "Shadows of Eldermoor",
    system: "D&D 5e",
    emblem: "E",
    blurb:
      "A creeping blight swallows the northern holds. The party hunts its source through ruined keeps and older, hungrier things.",
    pages: 42,
    characters: 6,
    members: ["mara@table.rpg", "dex@table.rpg", "wren@table.rpg", "tobi@table.rpg"],
  },
  {
    id: "saltveil-chronicles",
    name: "The Saltveil Chronicles",
    system: "Pathfinder 2e",
    emblem: "S",
    blurb:
      "Pirate-archaeologists race rival fleets to a drowned city, where every reef hides a curse and a fortune.",
    pages: 27,
    characters: 5,
    members: ["captain@table.rpg", "rook@table.rpg", "isla@table.rpg"],
  },
  {
    id: "neon-requiem",
    name: "Neon Requiem",
    system: "Cyberpunk RED",
    emblem: "N",
    blurb:
      "Edge-runners take a job that goes loud. Now the whole city wants them dead and the payout keeps getting bigger.",
    pages: 18,
    characters: 4,
    members: ["v@table.rpg", "glitch@table.rpg", "havoc@table.rpg"],
  },
  {
    id: "ashes-of-the-ninth",
    name: "Ashes of the Ninth",
    system: "Call of Cthulhu",
    emblem: "A",
    blurb:
      "Investigators piece together why an entire regiment vanished in 1918 — and what came back wearing their faces.",
    pages: 33,
    characters: 4,
    members: ["doc@table.rpg", "lena@table.rpg"],
  },
];

export default function CampaignsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="mt-1 text-gray-600">
            Pick up where your table left off, or start something new.
          </p>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-500"
        >
          New campaign
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
