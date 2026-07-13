"use server";

// Page writes are trusted logic and RLS denies client writes, which also
// guarantees the savePage wipe guard cannot be bypassed. Every action
// verifies the caller before using the service-role admin client.
//
// savePage implements the three recovery layers from the design spec:
//   Layer 1: previous_content_json (last-known-good) + soft delete
//   Layer 2: server-side wipe guard (blocks suspicious shrink until confirmed)
//   Layer 3: capped rolling snapshots in page_recovery_snapshots
//
// No revalidatePath here: the workspace page is fully dynamic and mutation
// callers follow up with router.refresh() (or apply the action result
// locally), so server-side revalidation would only re-render the page a
// second time inside the action response.
import { generateText, type JSONContent } from "@tiptap/core";
import { editorExtensions } from "@/lib/editor/extensions";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUserId, isCampaignMember } from "@/lib/queries/campaigns";
import type { ActionResult } from "@/app/actions/campaigns";
import type { NoteScope } from "@/app/actions/categories";

const TITLE_MAX = 200;
const WIPE_MIN_LENGTH = 200; // only guard documents with real content
const WIPE_SHRINK_RATIO = 0.1; // new text < 10% of old text = suspicious
const SNAPSHOTS_KEPT = 10;

export type SaveOutcome =
  | { status: "saved"; updatedAt: string }
  | { status: "needs_confirmation"; oldLength: number; newLength: number };

function validateTitle(title: string): string | null {
  if (!title) return "Page title is required.";
  if (title.length > TITLE_MAX)
    return `Title must be ${TITLE_MAX} characters or fewer.`;
  return null;
}

type PageRow = {
  id: string;
  campaign_id: string;
  owner_id: string;
  visibility: "public" | "private";
  content_json: JSONContent | null;
  content_text: string | null;
  deleted_at: string | null;
};

// Load a page and check the caller may modify it. Shared campaign pages are
// collaborative: any campaign member may edit them. Private "My notes" pages
// remain owner-only.
async function getEditablePage(
  pageId: string,
  userId: string
): Promise<{ page: PageRow } | { error: string }> {
  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages")
    .select(
      "id, campaign_id, owner_id, visibility, content_json, content_text, deleted_at"
    )
    .eq("id", pageId)
    .maybeSingle<PageRow>();
  if (!page || page.deleted_at) return { error: "Page not found." };

  if (!(await isCampaignMember(userId, page.campaign_id)))
    return { error: "You don't have access to this campaign." };
  if (page.visibility === "private" && page.owner_id !== userId)
    return { error: "Only the page's creator can modify it." };

  return { page };
}

export async function createPage(input: {
  campaignId: string;
  categoryId?: string | null;
  title: string;
  scope: NoteScope;
}): Promise<ActionResult<{ id: string }>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const title = (input.title ?? "").trim();
  const invalid = validateTitle(title);
  if (invalid) return { ok: false, error: invalid };

  const admin = createAdminClient();

  const categoryId = input.categoryId ?? null;
  const visibility = input.scope === "personal" ? "private" : "public";

  // Append at the end of the target container (category or tree root).
  let last = admin
    .from("pages")
    .select("sort_order")
    .eq("campaign_id", input.campaignId)
    .eq("visibility", visibility)
    .order("sort_order", { ascending: false })
    .limit(1);
  last = categoryId === null ? last.is("category_id", null) : last.eq("category_id", categoryId);

  // Membership, category validation, and the append-position lookup are
  // independent — run them in one round trip instead of three.
  const [isMember, categoryResult, { data: lastRow }] = await Promise.all([
    isCampaignMember(userId, input.campaignId),
    categoryId
      ? admin
          .from("categories")
          .select("campaign_id, owner_id")
          .eq("id", categoryId)
          .maybeSingle()
      : Promise.resolve(null),
    last.maybeSingle(),
  ]);

  if (!isMember)
    return { ok: false, error: "You don't have access to this campaign." };

  // A page's category must belong to the same campaign and the same tree
  // (shared category for campaign notes, own category for personal notes).
  if (categoryId) {
    const category = categoryResult?.data ?? null;
    const expectedOwner = input.scope === "personal" ? userId : null;
    if (!category || category.campaign_id !== input.campaignId)
      return { ok: false, error: "Category not found." };
    if (category.owner_id !== expectedOwner)
      return { ok: false, error: "Category belongs to a different notes tab." };
  }

  const sortOrder = (lastRow?.sort_order ?? 0) + 1;

  const { data, error } = await admin
    .from("pages")
    .insert({
      campaign_id: input.campaignId,
      category_id: categoryId,
      title,
      owner_id: userId,
      visibility,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error || !data)
    return { ok: false, error: "Could not create the page. Please try again." };

  return { ok: true, data: { id: data.id } };
}

export async function renamePage(
  id: string,
  title: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const trimmed = (title ?? "").trim();
  const invalid = validateTitle(trimmed);
  if (invalid) return { ok: false, error: invalid };

  const result = await getEditablePage(id, userId);
  if ("error" in result) return { ok: false, error: result.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("pages")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error)
    return { ok: false, error: "Could not rename the page. Please try again." };

  return { ok: true, data: undefined };
}

// Structural changes (move/reorder) are looser than content writes: any
// member may rearrange shared pages, but private pages stay owner-only.
async function getMovablePage(
  pageId: string,
  userId: string
): Promise<{ page: PageRow } | { error: string }> {
  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages")
    .select(
      "id, campaign_id, owner_id, visibility, content_json, content_text, deleted_at"
    )
    .eq("id", pageId)
    .maybeSingle<PageRow>();
  if (!page || page.deleted_at) return { error: "Page not found." };

  if (page.visibility === "private" && page.owner_id !== userId)
    return { error: "Only the page's creator can move it." };
  if (!(await isCampaignMember(userId, page.campaign_id)))
    return { error: "You don't have access to this campaign." };

  return { page };
}

// Move a page into a category (or to the root with categoryId null). The
// target category must belong to the same campaign and the same tree.
export async function movePage(
  id: string,
  categoryId: string | null
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const result = await getMovablePage(id, userId);
  if ("error" in result) return { ok: false, error: result.error };
  const { page } = result;

  const admin = createAdminClient();
  if (categoryId) {
    const { data: category } = await admin
      .from("categories")
      .select("campaign_id, owner_id")
      .eq("id", categoryId)
      .maybeSingle();
    const expectedOwner = page.visibility === "private" ? userId : null;
    if (!category || category.campaign_id !== page.campaign_id)
      return { ok: false, error: "Category not found." };
    if (category.owner_id !== expectedOwner)
      return { ok: false, error: "Category belongs to a different notes tab." };
  }

  const { error } = await admin
    .from("pages")
    .update({ category_id: categoryId })
    .eq("id", id);
  if (error)
    return { ok: false, error: "Could not move the page. Please try again." };

  return { ok: true, data: undefined };
}

// Persist a drag-reorder: the full ordered page list for one container (a
// category, or the tree root with categoryId null). Also assigns the
// container's category_id, so a cross-category drop is a single call.
export async function reorderPages(input: {
  campaignId: string;
  scope: NoteScope;
  categoryId: string | null;
  orderedIds: string[];
}): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  if (!(await isCampaignMember(userId, input.campaignId)))
    return { ok: false, error: "You don't have access to this campaign." };
  if (input.orderedIds.length === 0) return { ok: true, data: undefined };

  const admin = createAdminClient();

  // The target container must belong to this campaign and this tree.
  const expectedVisibility = input.scope === "personal" ? "private" : "public";
  if (input.categoryId) {
    const { data: category } = await admin
      .from("categories")
      .select("campaign_id, owner_id")
      .eq("id", input.categoryId)
      .maybeSingle();
    const expectedOwner = input.scope === "personal" ? userId : null;
    if (!category || category.campaign_id !== input.campaignId)
      return { ok: false, error: "Category not found." };
    if (category.owner_id !== expectedOwner)
      return { ok: false, error: "Category belongs to a different notes tab." };
  }

  // Every page must belong to this campaign and tree; private pages can only
  // be rearranged by their owner.
  const { data: rows } = await admin
    .from("pages")
    .select("id, campaign_id, visibility, owner_id, deleted_at")
    .in("id", input.orderedIds);
  const pages = rows ?? [];
  if (pages.length !== input.orderedIds.length)
    return { ok: false, error: "The page list is out of date. Reload and try again." };
  for (const page of pages) {
    if (
      page.campaign_id !== input.campaignId ||
      page.deleted_at ||
      page.visibility !== expectedVisibility
    )
      return { ok: false, error: "The page list is out of date. Reload and try again." };
    if (page.visibility === "private" && page.owner_id !== userId)
      return { ok: false, error: "Only the page's creator can move it." };
  }

  const updates = input.orderedIds.map((id, index) =>
    admin
      .from("pages")
      .update({ category_id: input.categoryId, sort_order: index + 1 })
      .eq("id", id)
  );
  const results = await Promise.all(updates);
  if (results.some((r) => r.error))
    return { ok: false, error: "Could not reorder the pages. Please try again." };

  return { ok: true, data: undefined };
}

// Hardened save. Returns needs_confirmation (without writing) when the new
// content looks like an accidental wipe and confirmWipe wasn't passed.
export async function savePage(
  pageId: string,
  newContentJson: JSONContent,
  confirmWipe = false
): Promise<ActionResult<SaveOutcome>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const result = await getEditablePage(pageId, userId);
  if ("error" in result) return { ok: false, error: result.error };
  const { page } = result;

  // Derive the plain text on the server — never trust the client's copy.
  let newText: string;
  try {
    newText = generateText(newContentJson, editorExtensions);
  } catch {
    return { ok: false, error: "The document could not be read." };
  }
  const oldText = page.content_text ?? "";

  // Layer 2: wipe guard — block and ask for confirmation.
  const looksLikeWipe =
    oldText.length > WIPE_MIN_LENGTH &&
    newText.trim().length < oldText.length * WIPE_SHRINK_RATIO;
  if (looksLikeWipe && !confirmWipe) {
    return {
      ok: true,
      data: {
        status: "needs_confirmation",
        oldLength: oldText.length,
        newLength: newText.trim().length,
      },
    };
  }

  const admin = createAdminClient();

  // Layer 3: rolling snapshot of the incoming content, pruned to the newest N.
  await admin.from("page_recovery_snapshots").insert({
    page_id: pageId,
    content_json: newContentJson,
    content_text: newText,
    saved_by: userId,
  });
  const { data: keep } = await admin
    .from("page_recovery_snapshots")
    .select("id")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(SNAPSHOTS_KEPT);
  if (keep && keep.length === SNAPSHOTS_KEPT) {
    const keepIds = keep.map((s) => s.id);
    await admin
      .from("page_recovery_snapshots")
      .delete()
      .eq("page_id", pageId)
      .not("id", "in", `(${keepIds.join(",")})`);
  }

  // Layer 1 + the actual write: keep the prior good copy alongside the new one.
  const updatedAt = new Date().toISOString();
  const { error } = await admin
    .from("pages")
    .update({
      content_json: newContentJson,
      content_text: newText,
      previous_content_json: page.content_json,
      updated_at: updatedAt,
    })
    .eq("id", pageId);
  if (error)
    return { ok: false, error: "Could not save the page. Please try again." };

  return { ok: true, data: { status: "saved", updatedAt } };
}

// Soft delete: the row (and its snapshots) stay recoverable.
export async function deletePage(id: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const result = await getEditablePage(id, userId);
  if ("error" in result) return { ok: false, error: result.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("pages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error)
    return { ok: false, error: "Could not delete the page. Please try again." };

  return { ok: true, data: undefined };
}

// One-step undo: restore the last-known-good copy saved by the previous save.
export async function restorePreviousContent(
  pageId: string
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const result = await getEditablePage(pageId, userId);
  if ("error" in result) return { ok: false, error: result.error };
  const { page } = result;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("pages")
    .select("previous_content_json")
    .eq("id", pageId)
    .maybeSingle();
  const previous = current?.previous_content_json as JSONContent | null;
  if (!previous) return { ok: false, error: "There is nothing to restore." };

  const text = generateText(previous, editorExtensions);
  const { error } = await admin
    .from("pages")
    .update({
      content_json: previous,
      content_text: text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);
  if (error)
    return { ok: false, error: "Could not restore the page. Please try again." };

  return { ok: true, data: undefined };
}

export type PageSnapshotSummary = {
  id: string;
  createdAt: string;
  savedByName: string;
  preview: string;
  charCount: number;
};

async function getReadablePage(
  pageId: string,
  userId: string
): Promise<{ page: PageRow } | { error: string }> {
  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages")
    .select(
      "id, campaign_id, owner_id, visibility, content_json, content_text, deleted_at"
    )
    .eq("id", pageId)
    .maybeSingle<PageRow>();
  if (!page || page.deleted_at) return { error: "Page not found." };

  if (!(await isCampaignMember(userId, page.campaign_id)))
    return { error: "You don't have access to this campaign." };
  if (page.visibility === "private" && page.owner_id !== userId)
    return { error: "Only the page's creator can view its history." };

  return { page };
}

/** List rolling recovery snapshots for a page (newest first). */
export async function listPageSnapshots(
  pageId: string
): Promise<ActionResult<PageSnapshotSummary[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const readable = await getReadablePage(pageId, userId);
  if ("error" in readable) return { ok: false, error: readable.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("page_recovery_snapshots")
    .select("id, content_text, saved_by, created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(SNAPSHOTS_KEPT);

  if (error) return { ok: false, error: error.message };

  const { resolveUserDisplayNames } = await import("@/lib/users/display-name");
  const names = await resolveUserDisplayNames(
    (data ?? []).map((row) => row.saved_by as string | null)
  );

  const snapshots: PageSnapshotSummary[] = (data ?? []).map((row) => {
    const text = (row.content_text ?? "").trim();
    const preview =
      text.length === 0
        ? "(empty)"
        : text.length > 140
          ? `${text.slice(0, 140)}…`
          : text;
    return {
      id: row.id,
      createdAt: row.created_at,
      savedByName: names.get(row.saved_by as string) ?? "Unknown",
      preview,
      charCount: text.length,
    };
  });

  return { ok: true, data: snapshots };
}

/** Restore a page to a snapshot by saving that content through savePage. */
export async function restorePageSnapshot(
  snapshotId: string
): Promise<ActionResult<{ contentJson: JSONContent }>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: snapshot } = await admin
    .from("page_recovery_snapshots")
    .select("id, page_id, content_json")
    .eq("id", snapshotId)
    .maybeSingle();

  if (!snapshot) return { ok: false, error: "Snapshot not found." };

  const editable = await getEditablePage(snapshot.page_id, userId);
  if ("error" in editable) return { ok: false, error: editable.error };

  const content = snapshot.content_json as JSONContent;
  const result = await savePage(snapshot.page_id, content, true);
  if (!result.ok) return result;
  if (result.data.status !== "saved") {
    return { ok: false, error: "Could not restore the page. Please try again." };
  }

  return { ok: true, data: { contentJson: content } };
}

export type PageLiveState = {
  contentJson: JSONContent | null;
  updatedAt: string;
  lastSavedByName: string;
};

/** Live state for collaborative sync after a peer saves. */
export async function getPageLiveState(
  pageId: string
): Promise<ActionResult<PageLiveState>> {
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: "You must be signed in." };

  const readable = await getReadablePage(pageId, userId);
  if ("error" in readable) return { ok: false, error: readable.error };

  const admin = createAdminClient();
  const { data: page, error } = await admin
    .from("pages")
    .select("content_json, updated_at")
    .eq("id", pageId)
    .maybeSingle();

  if (error || !page) return { ok: false, error: "Page not found." };

  const { data: latestSnapshot } = await admin
    .from("page_recovery_snapshots")
    .select("saved_by")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { resolveUserDisplayName } = await import("@/lib/users/display-name");
  const lastSavedByName = latestSnapshot?.saved_by
    ? await resolveUserDisplayName(latestSnapshot.saved_by as string)
    : "Someone";

  return {
    ok: true,
    data: {
      contentJson: (page.content_json as JSONContent | null) ?? null,
      updatedAt: page.updated_at as string,
      lastSavedByName,
    },
  };
}
