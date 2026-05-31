"use server";

import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

// Inviting someone is multi-step authorization logic, not just a row write:
// check permission, mint a token, record it. invites/memberships are written
// with the trusted client (RLS denies client writes).
export async function inviteMember(campaignId: string, email?: string) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Only the DM can invite
  const { data: me } = await supabase
    .from("memberships")
    .select("role")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();
  if (me?.role !== "dm") throw new Error("Only the DM can invite");

  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const admin = createAdminClient();
  await admin.from("invites").insert({
    campaign_id: campaignId,
    email,
    token,
    invited_by: user.id,
    expires_at: expires.toISOString(),
  });

  return `${process.env.APP_URL}/join/${token}`; // share this link
}

export async function acceptInvite(token: string) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first");

  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .single();

  if (!invite) throw new Error("Invalid invite");
  if (invite.accepted_at) throw new Error("Invite already used");
  if (new Date(invite.expires_at) < new Date()) throw new Error("Invite expired");

  // Create membership (unique constraint blocks duplicates)
  await admin.from("memberships").insert({
    campaign_id: invite.campaign_id,
    user_id: user.id,
    role: invite.role,
  });

  await admin
    .from("invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return invite.campaign_id as string;
}
