"use client";

import Image from "next/image";
import { NavLink } from "@/components/navigation/NavLink";
import { PictoAvatar } from "@/components/PictoAvatar";
import { Tooltip, Chip } from "@/components/ui";
import { accentHatchStyle } from "@/lib/ui/accent-hatch";
import { useI18n } from "@/lib/i18n/context";

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
  /** True when the signed-in user owns this campaign (Admin). */
  isOwner?: boolean;
  // Sample campaign shown for illustration; not part of the user's account.
  demo?: boolean;
  /** Public URL of the cover image; null/undefined falls back to the hatch banner. */
  imageUrl?: string | null;
};

const MAX_AVATARS = 4;

function emblemFor(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { t } = useI18n();
  const { id, name, description, members = [], memberCount, memberLabels, role, isOwner, demo, imageUrl } =
    campaign;
  const count = memberCount ?? members.length;
  const shown = members.slice(0, MAX_AVATARS);
  const overflow = count - shown.length;

  return (
    <NavLink
      href={`/campaigns/${id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden rounded-t-2xl bg-accent-800"
        style={imageUrl ? undefined : accentHatchStyle}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="text-4xl font-bold text-white/90">
            {emblemFor(name)}
          </span>
        )}
        {demo && (
          <Chip
            variant="onDarkSolid"
            className="absolute left-3 top-3 uppercase tracking-wide"
          >
            {t("campaigns.demo")}
          </Chip>
        )}
        {isOwner && (
          <Chip
            variant="onDarkSolid"
            className="absolute left-3 top-3 uppercase tracking-wide"
          >
            {t("campaignMembers.admin")}
          </Chip>
        )}
        {role === "dm" && (
          <Chip variant="onDark" className="absolute right-3 top-3">
            {t("campaignMembers.dm")}
          </Chip>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-lg font-semibold group-hover:text-accent-700">
          {name}
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-600">
          {description || t("campaigns.noDescription")}
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
            {t(count === 1 ? "campaignMembers.memberCountSingular" : "campaignMembers.memberCountPlural", { count })}
          </span>
        </div>
      </div>
    </NavLink>
  );
}
