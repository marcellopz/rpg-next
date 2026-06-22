"use server";

// Campaign writes are trusted, multi-step authorization logic (create a
// campaign AND the creator's DM membership; only a DM may edit/delete), so they
// live in server actions. RLS denies client writes to campaigns/memberships, so
// these use the service-role admin client AFTER verifying the caller.
import { revalidatePath } from "next/cache";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const NAME_MAX = 120;
const DESC_MAX = 2000;

type AdminClient = ReturnType<typeof createAdminClient>;

async function getCurrentUserId(): Promise<string | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// True if the user owns the campaign or holds the DM role on it.
async function isCampaignAdmin(
  admin: AdminClient,
  userId: string,
  campaignId: string,
): Promise<boolean> {
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

function validateFields(name: string, description: string): string | null {
  if (!name) return "Campaign name is required.";
  if (name.length > NAME_MAX)
    return `Name must be ${NAME_MAX} characters or fewer.`;
  if (description.length > DESC_MAX)
    return `Description must be ${DESC_MAX} characters or fewer.`;
  return null;
}

export async function createCampaign(input: {
  name: string;
  description?: string;
}): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();
  if (!userId)
    return { ok: false, error: "You must be signed in to create a campaign." };

  const name = (input.name ?? "").trim();
  const description = (input.description ?? "").trim();
  const invalid = validateFields(name, description);
  if (invalid) return { ok: false, error: invalid };

  const admin = createAdminClient();

  const { data: campaign, error: cErr } = await admin
    .from("campaigns")
    .insert({ name, description, owner_id: userId })
    .select("id")
    .single();
  if (cErr || !campaign)
    return {
      ok: false,
      error: "Could not create the campaign. Please try again.",
    };

  const { error: mErr } = await admin
    .from("memberships")
    .insert({ campaign_id: campaign.id, user_id: userId, role: "dm" });
  if (mErr) {
    // Roll back the orphaned campaign so the user can retry cleanly.
    await admin.from("campaigns").delete().eq("id", campaign.id);
    return {
      ok: false,
      error: "Could not set up campaign membership. Please try again.",
    };
  }

  revalidatePath("/campaigns");
  return { ok: true, data: { id: campaign.id } };
}

export async function updateCampaign(
  id: string,
  input: { name: string; description?: string },
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const name = (input.name ?? "").trim();
  const description = (input.description ?? "").trim();
  const invalid = validateFields(name, description);
  if (invalid) return { ok: false, error: invalid };

  const admin = createAdminClient();
  const allowed = await isCampaignAdmin(admin, userId, id);
  if (!allowed)
    return {
      ok: false,
      error: "You don't have permission to edit this campaign.",
    };

  const { error } = await admin
    .from("campaigns")
    .update({ name, description })
    .eq("id", id);
  if (error)
    return { ok: false, error: "Could not save changes. Please try again." };

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  return { ok: true, data: undefined };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const admin = createAdminClient();
  const allowed = await isCampaignAdmin(admin, userId, id);
  if (!allowed)
    return {
      ok: false,
      error: "You don't have permission to delete this campaign.",
    };

  // memberships (and other campaign-scoped rows) cascade via FK on delete.
  const { error } = await admin.from("campaigns").delete().eq("id", id);
  if (error)
    return {
      ok: false,
      error: "Could not delete the campaign. Please try again.",
    };

  revalidatePath("/campaigns");
  return { ok: true, data: undefined };
}
