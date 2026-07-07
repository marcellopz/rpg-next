"use server";

// Campaign writes are trusted, multi-step authorization logic (create a
// campaign AND the creator's membership). Only the campaign admin (owner)
// may edit settings, invites, and member roles. RLS denies client writes, so
// these use the service-role admin client AFTER verifying the caller.
import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getCurrentUserId,
  isCampaignOwner,
} from "@/lib/queries/campaigns";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const NAME_MAX = 120;
const DESC_MAX = 2000;
const PUBLIC_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const PUBLIC_CODE_LENGTH = 6;
const PUBLIC_CODE_ATTEMPTS = 5;

function validateFields(name: string, description: string): string | null {
  if (!name) return "Campaign name is required.";
  if (name.length > NAME_MAX)
    return `Name must be ${NAME_MAX} characters or fewer.`;
  if (description.length > DESC_MAX)
    return `Description must be ${DESC_MAX} characters or fewer.`;
  return null;
}

function generatePublicCode(): string {
  let code = "";

  for (let i = 0; i < PUBLIC_CODE_LENGTH; i += 1) {
    code += PUBLIC_CODE_ALPHABET[randomInt(PUBLIC_CODE_ALPHABET.length)];
  }

  return code;
}

async function revalidateCampaign(publicCode: string | null | undefined) {
  revalidatePath("/campaigns");
  if (publicCode) {
    revalidatePath(`/campaigns/${publicCode}`);
    revalidatePath(`/campaigns/${publicCode}/settings`);
  }
}

export async function createCampaign(input: {
  name: string;
  description?: string;
}): Promise<ActionResult<{ id: string; publicCode: string }>> {
  const userId = await getCurrentUserId();
  if (!userId)
    return { ok: false, error: "You must be signed in to create a campaign." };

  const name = (input.name ?? "").trim();
  const description = (input.description ?? "").trim();
  const invalid = validateFields(name, description);
  if (invalid) return { ok: false, error: invalid };

  const admin = createAdminClient();

  let campaign: { id: string; public_code: string } | null = null;
  let lastCreateError: unknown = null;

  for (let attempt = 0; attempt < PUBLIC_CODE_ATTEMPTS; attempt += 1) {
    const publicCode = generatePublicCode();
    const { data, error } = await admin
      .from("campaigns")
      .insert({ name, description, owner_id: userId, public_code: publicCode })
      .select("id, public_code")
      .single();

    if (!error && data) {
      campaign = data;
      break;
    }

    lastCreateError = error;
    if (error?.code !== "23505") break;
  }

  if (!campaign) {
    console.error("[createCampaign] insert error:", lastCreateError);
    return {
      ok: false,
      error: "Could not create the campaign. Please try again.",
    };
  }

  // Creator is Admin (owner) and starts as DM for combat control later.
  const { error: mErr } = await admin
    .from("memberships")
    .insert({ campaign_id: campaign.id, user_id: userId, role: "dm" });
  if (mErr) {
    await admin.from("campaigns").delete().eq("id", campaign.id);
    return {
      ok: false,
      error: "Could not set up campaign membership. Please try again.",
    };
  }

  revalidatePath("/campaigns");
  return { ok: true, data: { id: campaign.id, publicCode: campaign.public_code } };
}

export async function updateCampaign(
  id: string,
  input: { name: string; description?: string }
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const name = (input.name ?? "").trim();
  const description = (input.description ?? "").trim();
  const invalid = validateFields(name, description);
  if (invalid) return { ok: false, error: invalid };

  if (!(await isCampaignOwner(userId, id))) {
    return {
      ok: false,
      error: "You don't have permission to edit this campaign.",
    };
  }

  const admin = createAdminClient();
  const { data: campaign, error } = await admin
    .from("campaigns")
    .update({ name, description })
    .eq("id", id)
    .select("public_code")
    .maybeSingle();
  if (error)
    return { ok: false, error: "Could not save changes. Please try again." };

  await revalidateCampaign(campaign?.public_code);
  return { ok: true, data: undefined };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  if (!(await isCampaignOwner(userId, id))) {
    return {
      ok: false,
      error: "You don't have permission to delete this campaign.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("campaigns").delete().eq("id", id);
  if (error)
    return {
      ok: false,
      error: "Could not delete the campaign. Please try again.",
    };

  revalidatePath("/campaigns");
  return { ok: true, data: undefined };
}

export async function setMemberRole(input: {
  campaignId: string;
  userId: string;
  role: "dm" | "player";
}): Promise<ActionResult> {
  const callerId = await getCurrentUserId();
  if (!callerId) return { ok: false, error: "You must be signed in." };

  if (!(await isCampaignOwner(callerId, input.campaignId))) {
    return {
      ok: false,
      error: "Only the campaign admin can change member roles.",
    };
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("memberships")
    .select("id")
    .eq("campaign_id", input.campaignId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!membership) return { ok: false, error: "Member not found." };

  const { data: campaign, error } = await admin
    .from("memberships")
    .update({ role: input.role })
    .eq("id", membership.id)
    .select("campaign_id")
    .maybeSingle();
  if (error || !campaign)
    return { ok: false, error: "Could not update member role." };

  const { data: campaignRow } = await admin
    .from("campaigns")
    .select("public_code")
    .eq("id", input.campaignId)
    .maybeSingle();
  await revalidateCampaign(campaignRow?.public_code);
  return { ok: true, data: undefined };
}
