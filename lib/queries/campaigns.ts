// Read-side data access for campaigns. Keep Supabase queries here (named for
// what they fetch) rather than inline in components/pages or server actions.
import {
  createServerClient,
  createAdminClient,
  getCurrentUser,
} from "@/lib/supabase/server";
import type { Campaign } from "@/components/campaigns/CampaignCard";

export {
  isCampaignMember,
  isCampaignOwner,
  isCampaignDm,
} from "@/lib/campaign/permissions";

type MembershipWithCampaign = {
  role: "dm" | "player";
  campaigns: {
    id: string;
    public_code: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string;
    image_path: string | null;
  } | null;
};

// Public URL for an object in the public-assets bucket (null path = no image).
function publicAssetUrl(
  supabase: ReturnType<typeof createServerClient>,
  path: string | null
): string | null {
  if (!path) return null;
  return supabase.storage.from("public-assets").getPublicUrl(path).data
    .publicUrl;
}

export type CampaignsForCurrentUser = {
  isSignedIn: boolean;
  campaigns: Campaign[];
};

// The current user's id, or null when there is no session.
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

// The signed-in user's campaigns (newest first) with member avatars + role.
// Returns isSignedIn:false (and no campaigns) when there's no session, so the
// caller can decide what to show logged-out visitors.
export async function getCampaignsForCurrentUser(): Promise<CampaignsForCurrentUser> {
  const user = await getCurrentUser();
  if (!user) return { isSignedIn: false, campaigns: [] };
  const supabase = createServerClient();

  // RLS scopes this to the caller's memberships.
  const { data: membershipRows } = await supabase
    .from("memberships")
    .select(
      "role, campaigns(id, public_code, name, description, owner_id, created_at, image_path)"
    )
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

  const memberSeeds = new Map<string, string[]>();
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
        id: r.campaigns.public_code,
        name: r.campaigns.name,
        description: r.campaigns.description ?? "",
        members: seeds,
        memberCount: seeds.length || 1,
        memberLabels: labelMap,
        role: r.role,
        isOwner: r.campaigns.owner_id === user.id,
        imageUrl: publicAssetUrl(supabase, r.campaigns.image_path),
      };
    });

  return { isSignedIn: true, campaigns };
}

export type CampaignDetail = {
  id: string;
  publicCode: string;
  name: string;
  description: string;
  role: "dm" | "player" | null;
  /** Campaign admin (owner). Controls settings, invites, and DM assignment. */
  isAdmin: boolean;
  /** Membership DM role. Will gate combat editing when that tool ships. */
  isDm: boolean;
  /** Public URL of the cover image, or null to fall back to the gradient. */
  imageUrl: string | null;
};

// A single campaign for the current viewer, plus their role and permissions.
// Returns null when the campaign doesn't exist or the caller can't access it.
export async function getCampaignDetailForCurrentUser(
  campaignCode: string
): Promise<CampaignDetail | null> {
  const supabase = createServerClient();
  const [user, { data: campaign }] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("campaigns")
      .select(
        "id, public_code, name, description, owner_id, created_at, image_path"
      )
      .eq("public_code", campaignCode)
      .maybeSingle(),
  ]);
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

  const isAdmin = !!user && campaign.owner_id === user.id;
  const isDm = role === "dm";

  return {
    id: campaign.id,
    publicCode: campaign.public_code,
    name: campaign.name,
    description: campaign.description ?? "",
    role,
    isAdmin,
    isDm,
    imageUrl: publicAssetUrl(supabase, campaign.image_path),
  };
}
