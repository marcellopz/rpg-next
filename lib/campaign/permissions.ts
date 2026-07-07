import { createAdminClient } from "@/lib/supabase/server";

// Campaign permission helpers. Admin = owner_id; DM = membership role.
// Uses the admin client to bypass RLS — only call from trusted server code.

export async function isCampaignOwner(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("campaigns")
    .select("owner_id")
    .eq("id", campaignId)
    .maybeSingle();
  return campaign?.owner_id === userId;
}

export async function isCampaignDm(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  return membership?.role === "dm";
}

export async function isCampaignMember(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("memberships")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  if (membership) return true;

  return isCampaignOwner(userId, campaignId);
}
