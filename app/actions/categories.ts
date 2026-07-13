"use server";

// Category writes are trusted logic: RLS denies client writes, so every
// action verifies the caller (membership; ownership for personal-tree
// categories) and then uses the service-role admin client.
//
// No revalidatePath here: the workspace page is fully dynamic and every
// caller follows up with router.refresh(), so server-side revalidation would
// only re-render the page a second time inside the action response.
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, isCampaignMember } from "@/lib/queries/campaigns";
import type { ActionResult } from "@/app/actions/campaigns";

const NAME_MAX = 80;

export type NoteScope = "campaign" | "personal";

function validateName(name: string): string | null {
  if (!name) return "Category name is required.";
  if (name.length > NAME_MAX)
    return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
}

type CategoryRow = {
  id: string;
  campaign_id: string;
  owner_id: string | null;
};

// Load a category and check the caller may modify it: member of the campaign,
// and for personal-tree categories, the tree's owner.
async function getEditableCategory(
  categoryId: string,
  userId: string
): Promise<{ category: CategoryRow } | { error: string }> {
  const admin = createAdminClient();
  const { data: category } = await admin
    .from("categories")
    .select("id, campaign_id, owner_id")
    .eq("id", categoryId)
    .maybeSingle<CategoryRow>();
  if (!category) return { error: "Category not found." };

  if (!(await isCampaignMember(userId, category.campaign_id)))
    return { error: "You don't have access to this campaign." };
  if (category.owner_id !== null && category.owner_id !== userId)
    return { error: "You can only modify your own categories." };

  return { category };
}

export async function createCategory(input: {
  campaignId: string;
  name: string;
  scope: NoteScope;
}): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const name = (input.name ?? "").trim();
  const invalid = validateName(name);
  if (invalid) return { ok: false, error: invalid };

  const admin = createAdminClient();

  // Append at the end of the tree's category list. The membership check and
  // the append-position lookup are independent — run them in one round trip.
  const ownerFilter = input.scope === "personal" ? userId : null;
  let last = admin
    .from("categories")
    .select("sort_order")
    .eq("campaign_id", input.campaignId)
    .order("sort_order", { ascending: false })
    .limit(1);
  last =
    ownerFilter === null ? last.is("owner_id", null) : last.eq("owner_id", ownerFilter);

  const [isMember, { data: lastRow }] = await Promise.all([
    isCampaignMember(userId, input.campaignId),
    last.maybeSingle(),
  ]);
  if (!isMember)
    return { ok: false, error: "You don't have access to this campaign." };
  const sortOrder = (lastRow?.sort_order ?? 0) + 1;

  const { data, error } = await admin
    .from("categories")
    .insert({
      campaign_id: input.campaignId,
      name,
      owner_id: ownerFilter,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error || !data)
    return { ok: false, error: "Could not create the category. Please try again." };

  return { ok: true, data: { id: data.id } };
}

export async function renameCategory(
  id: string,
  name: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const trimmed = (name ?? "").trim();
  const invalid = validateName(trimmed);
  if (invalid) return { ok: false, error: invalid };

  const result = await getEditableCategory(id, userId);
  if ("error" in result) return { ok: false, error: result.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("categories")
    .update({ name: trimmed })
    .eq("id", id);
  if (error)
    return { ok: false, error: "Could not rename the category. Please try again." };

  return { ok: true, data: undefined };
}

// Persist a drag-reorder of a tree's category list: sort_order = list index.
export async function reorderCategories(input: {
  campaignId: string;
  scope: NoteScope;
  orderedIds: string[];
}): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  if (!(await isCampaignMember(userId, input.campaignId)))
    return { ok: false, error: "You don't have access to this campaign." };

  const admin = createAdminClient();
  const ownerFilter = input.scope === "personal" ? userId : null;
  let query = admin
    .from("categories")
    .select("id")
    .eq("campaign_id", input.campaignId);
  query =
    ownerFilter === null ? query.is("owner_id", null) : query.eq("owner_id", ownerFilter);
  const { data: rows } = await query;

  const validIds = new Set((rows ?? []).map((r) => r.id));
  if (!input.orderedIds.every((id) => validIds.has(id)))
    return { ok: false, error: "The category list is out of date. Reload and try again." };

  const updates = input.orderedIds.map((id, index) =>
    admin.from("categories").update({ sort_order: index + 1 }).eq("id", id)
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error))
    return { ok: false, error: "Could not reorder the categories. Please try again." };

  return { ok: true, data: undefined };
}

// Deleting a category does not delete its pages: the FK is `on delete set
// null`, so they fall back to the root of their tree.
export async function deleteCategory(id: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const result = await getEditableCategory(id, userId);
  if ("error" in result) return { ok: false, error: result.error };

  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error)
    return { ok: false, error: "Could not delete the category. Please try again." };

  return { ok: true, data: undefined };
}
