// Read-side data access for campaigns. Keep Supabase queries here (named for
// what they fetch) rather than inline in components/pages or server actions.
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import type { Campaign } from "@/components/campaigns/CampaignCard";

type MembershipWithCampaign = {
  role: "dm" | "player";
  campaigns: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  } | null;
};

export type CampaignsForCurrentUser = {
  isSignedIn: boolean;
  campaigns: Campaign[];
};

// The current user's id, or null when there is no session.
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// True if the user owns the campaign or holds the DM role on it.
// Uses the admin client to bypass RLS — only called from trusted server actions.
export async function isCampaignAdmin(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from("campaigns")
    .select("owner_id")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return false;
  if (campaign.owner_id === userId) return true;

  const { data: membership } = await admin
    .from("memberships")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  return membership?.role === "dm";
}

// The signed-in user's campaigns (newest first) with member avatars + role.
// Returns isSignedIn:false (and no campaigns) when there's no session, so the
// caller can decide what to show logged-out visitors.
export async function getCampaignsForCurrentUser(): Promise<CampaignsForCurrentUser> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isSignedIn: false, campaigns: [] };

  // RLS scopes this to the caller's memberships.
  const { data: membershipRows } = await supabase
    .from("memberships")
    .select("role, campaigns(id, name, description, created_at)")
    .eq("user_id", user.id)
    .returns<MembershipWithCampaign[]>();

  const rows = (membershipRows ?? []).filter(
    (
      r
    ): r is MembershipWithCampaign & {
      campaigns: NonNullable<MembershipWithCampaign["campaigns"]>;
    } => r.campaigns !== null
  );
  const campaignIds = rows.map((r) => r.campaigns.id);

  // The user can read memberships for every campaign they belong to, so fetch
  // them in one query and group member ids per campaign (they double as stable
  // avatar seeds).
  const memberSeeds = new Map<string, string[]>();
  // Collect all unique member ids so we can resolve their display names in one
  // parallel batch, rather than per-campaign.
  const allMemberIds = new Set<string>();
  if (campaignIds.length > 0) {
    const { data: memberRows } = await supabase
      .from("memberships")
      .select("campaign_id, user_id")
      .in("campaign_id", campaignIds);
    for (const m of memberRows ?? []) {
      const seeds = memberSeeds.get(m.campaign_id) ?? [];
      seeds.push(m.user_id);
      memberSeeds.set(m.campaign_id, seeds);
      allMemberIds.add(m.user_id);
    }
  }

  // Resolve display names for every member via the admin auth API.
  const admin = createAdminClient();
  const labelMap: Record<string, string> = {};
  await Promise.all(
    Array.from(allMemberIds).map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      if (data.user) {
        labelMap[userId] =
          (data.user.user_metadata?.display_name as string | undefined) ??
          data.user.email ??
          userId;
      }
    })
  );

  const campaigns: Campaign[] = rows
    .sort((a, b) => b.campaigns.created_at.localeCompare(a.campaigns.created_at))
    .map((r) => {
      const seeds = memberSeeds.get(r.campaigns.id) ?? [];
      return {
        id: r.campaigns.id,
        name: r.campaigns.name,
        description: r.campaigns.description ?? "",
        members: seeds,
        memberCount: seeds.length || 1,
        memberLabels: labelMap,
        role: r.role,
      };
    });

  return { isSignedIn: true, campaigns };
}

export type CampaignDetail = {
  id: string;
  name: string;
  description: string;
  role: "dm" | "player" | null;
  isAdmin: boolean;
};

// A single campaign for the current viewer, plus their role and whether they
// may administer it. Returns null when the campaign doesn't exist or the caller
// can't access it (RLS yields no row, including for malformed/demo ids).
export async function getCampaignDetailForCurrentUser(
  campaignId: string
): Promise<CampaignDetail | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, description, owner_id, created_at")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return null;

  let role: "dm" | "player" | null = null;
  if (user) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("campaign_id", campaign.id)
      .eq("user_id", user.id)
      .maybeSingle();
    role = (membership?.role as "dm" | "player" | undefined) ?? null;
  }
  const isAdmin = !!user && (campaign.owner_id === user.id || role === "dm");

  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description ?? "",
    role,
    isAdmin,
  };
}
