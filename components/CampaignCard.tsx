import Link from "next/link";
import { PictoAvatar } from "@/components/PictoAvatar";

export type Campaign = {
  id: string;
  name: string;
  system: string;
  emblem: string;
  blurb: string;
  pages: number;
  characters: number;
  members: string[];
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { id, name, system, emblem, blurb, pages, characters, members } =
    campaign;

  return (
    <Link
      href={`/campaigns/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
    >
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-accent-600 to-accent-800">
        <span className="text-4xl font-bold text-white/90">{emblem}</span>
        <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
          {system}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold group-hover:text-accent-700">
          {name}
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-600">{blurb}</p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <PictoAvatar
                key={m}
                seed={m}
                size={28}
                className="border-2 border-white"
              />
            ))}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{pages} pages</span>
            <span>{characters} chars</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
