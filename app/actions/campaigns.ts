"use server";

import { createServerClient, createAdminClient } from "@/lib/supabase/server";

// Create the campaign AND make the creator the DM, atomically (two coordinated
// writes + a decision about role) — so it's a server action, not a client call.
export async function createCampaign(name: string) {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // 1. Create the campaign
  const { data: campaign, error: cErr } = await supabase
    .from("campaigns")
    .insert({ name, owner_id: user.id })
    .select()
    .single();
  if (cErr) throw cErr;

  // 2. Make the creator the DM. memberships writes go through the trusted
  //    (service-role) client since client writes are denied by RLS.
  const admin = createAdminClient();
  const { error: mErr } = await admin
    .from("memberships")
    .insert({ campaign_id: campaign.id, user_id: user.id, role: "dm" });
  if (mErr) throw mErr;

  return campaign;
}
