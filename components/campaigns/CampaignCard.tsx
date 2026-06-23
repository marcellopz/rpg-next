import Link from "next/link";
import { PictoAvatar } from "@/components/PictoAvatar";
import { Tooltip, Chip } from "@/components/ui";

export type Campaign = {
  id: string;
  name: string;
  description: string;
  memberCount?: number;
  // Stable seeds (user ids or emails) used to render member avatars.
  members?: string[];
  // Human-readable label for each seed (display name or email). Falls back to
  // the seed itself when a label is not provided (e.g. demo campaigns).
  memberLabels?: Record<string, string>;
  role?: "dm" | "player";
  // Sample campaign shown for illustration; not part of the user's account.
  demo?: boolean;
};

const MAX_AVATARS = 4;

function emblemFor(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { id, name, description, members = [], memberCount, memberLabels, role, demo } =
    campaign;
  const count = memberCount ?? members.length;
  const shown = members.slice(0, MAX_AVATARS);
  const overflow = count - shown.length;

  return (
    <Link
      href={`/campaigns/${id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="relative flex h-28 items-center justify-center rounded-t-2xl bg-gradient-to-br from-accent-600 to-accent-800">
        <span className="text-4xl font-bold text-white/90">
          {emblemFor(name)}
        </span>
        {demo && (
          <Chip
            variant="onDarkSolid"
            className="absolute left-3 top-3 uppercase tracking-wide"
          >
            Demo
          </Chip>
        )}
        {role === "dm" && (
          <Chip variant="onDark" className="absolute right-3 top-3">
            DM
          </Chip>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-lg font-semibold group-hover:text-accent-700">
          {name}
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-600">
          {description || "No description yet."}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center">
            {shown.length > 0 && (
              <div className="flex -space-x-2">
                {shown.map((seed) => (
                  <Tooltip key={seed} label={memberLabels?.[seed] ?? seed}>
                    <PictoAvatar
                      seed={seed}
                      size={32}
                      className="border-2 border-white"
                    />
                  </Tooltip>
                ))}
              </div>
            )}
            {overflow > 0 && (
              <span className="ml-2 text-xs text-gray-500">+{overflow}</span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {count} {count === 1 ? "member" : "members"}
          </span>
        </div>
      </div>
    </Link>
  );
}
