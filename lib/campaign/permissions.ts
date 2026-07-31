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

// A member is anyone with a membership row, plus the owner (who may not have
// one). Both lookups run in parallel: the previous sequential version paid a
// second round trip on every owner-initiated write, and owners are the most
// active writers.
export async function isCampaignMember(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const admin = createAdminClient();

  const [{ data: membership }, { data: campaign }] = await Promise.all([
    admin
      .from("memberships")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("campaigns")
      .select("owner_id")
      .eq("id", campaignId)
      .maybeSingle(),
  ]);

  return !!membership || campaign?.owner_id === userId;
}
