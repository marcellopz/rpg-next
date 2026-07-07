"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { getCurrentUserId, isCampaignOwner } from "@/lib/queries/campaigns";
import type { ActionResult } from "@/app/actions/campaigns";

const EMAIL_MAX = 320;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  if (email.length > EMAIL_MAX)
    return `Email must be ${EMAIL_MAX} characters or fewer.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Enter a valid email address.";
  return null;
}

async function getCampaignPublicCode(campaignId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaigns")
    .select("public_code")
    .eq("id", campaignId)
    .maybeSingle();
  return data?.public_code ?? null;
}

async function revalidateCampaignSettings(campaignId: string) {
  const publicCode = await getCampaignPublicCode(campaignId);
  revalidatePath("/account");
  revalidatePath("/campaigns");
  if (publicCode) {
    revalidatePath(`/campaigns/${publicCode}`);
    revalidatePath(`/campaigns/${publicCode}/settings`);
  }
}

type InviteRow = {
  id: string;
  campaign_id: string;
  invitee_email: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

async function getCurrentUserWithEmail(): Promise<{
  id: string;
  email: string;
} | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return { id: user.id, email: normalizeEmail(user.email) };
}

export async function createCampaignInvite(input: {
  campaignId: string;
  email: string;
}): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUserWithEmail();
  if (!user) return { ok: false, error: "You must be signed in." };

  const email = normalizeEmail(input.email);
  const invalid = validateEmail(email);
  if (invalid) return { ok: false, error: invalid };
  if (email === user.email)
    return { ok: false, error: "You are already a member of this campaign." };

  if (!(await isCampaignOwner(user.id, input.campaignId))) {
    return {
      ok: false,
      error: "You don't have permission to invite members to this campaign.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaign_invites")
    .insert({
      campaign_id: input.campaignId,
      invitee_email: email,
      role: "player",
      invited_by: user.id,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    return {
      ok: false,
      error: "There is already a pending invite for this email.",
    };
  }
  if (error || !data) {
    return { ok: false, error: "Could not create the invite. Please try again." };
  }

  await revalidateCampaignSettings(input.campaignId);
  return { ok: true, data: { id: data.id } };
}

export async function revokeCampaignInvite(
  inviteId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("campaign_invites")
    .select("id, campaign_id, invitee_email, accepted_at, revoked_at")
    .eq("id", inviteId)
    .maybeSingle<InviteRow>();
  if (!invite) return { ok: false, error: "Invite not found." };
  if (!(await isCampaignOwner(userId, invite.campaign_id))) {
    return { ok: false, error: "You don't have permission to revoke this invite." };
  }
  if (invite.accepted_at)
    return { ok: false, error: "Accepted invites cannot be revoked." };
  if (invite.revoked_at) return { ok: true, data: undefined };

  const { error } = await admin
    .from("campaign_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId);
  if (error)
    return { ok: false, error: "Could not revoke the invite. Please try again." };

  await revalidateCampaignSettings(invite.campaign_id);
  return { ok: true, data: undefined };
}

export async function acceptCampaignInvite(
  inviteId: string
): Promise<ActionResult<{ publicCode: string | null }>> {
  const user = await getCurrentUserWithEmail();
  if (!user) return { ok: false, error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("campaign_invites")
    .select("id, campaign_id, invitee_email, accepted_at, revoked_at")
    .eq("id", inviteId)
    .maybeSingle<InviteRow>();
  if (!invite) return { ok: false, error: "Invite not found." };
  if (normalizeEmail(invite.invitee_email) !== user.email) {
    return { ok: false, error: "This invite belongs to a different email." };
  }
  if (invite.revoked_at)
    return { ok: false, error: "This invite is no longer available." };

  const acceptedAt = new Date().toISOString();
  if (!invite.accepted_at) {
    const { error: membershipError } = await admin.from("memberships").insert({
      campaign_id: invite.campaign_id,
      user_id: user.id,
      role: "player",
    });
    if (membershipError && membershipError.code !== "23505") {
      return {
        ok: false,
        error: "Could not join the campaign. Please try again.",
      };
    }

    const { error: inviteError } = await admin
      .from("campaign_invites")
      .update({ accepted_by: user.id, accepted_at: acceptedAt })
      .eq("id", inviteId);
    if (inviteError) {
      return {
        ok: false,
        error: "Could not accept the invite. Please try again.",
      };
    }
  }

  const publicCode = await getCampaignPublicCode(invite.campaign_id);
  await revalidateCampaignSettings(invite.campaign_id);
  return { ok: true, data: { publicCode } };
}

export async function declineCampaignInvite(
  inviteId: string
): Promise<ActionResult> {
  const user = await getCurrentUserWithEmail();
  if (!user) return { ok: false, error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("campaign_invites")
    .select("id, campaign_id, invitee_email, accepted_at, revoked_at")
    .eq("id", inviteId)
    .maybeSingle<InviteRow>();
  if (!invite) return { ok: false, error: "Invite not found." };
  if (normalizeEmail(invite.invitee_email) !== user.email) {
    return { ok: false, error: "This invite belongs to a different email." };
  }
  if (invite.accepted_at)
    return { ok: false, error: "Accepted invites cannot be declined." };
  if (invite.revoked_at) return { ok: true, data: undefined };

  const { error } = await admin
    .from("campaign_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId);
  if (error)
    return { ok: false, error: "Could not decline the invite. Please try again." };

  await revalidateCampaignSettings(invite.campaign_id);
  return { ok: true, data: undefined };
}
