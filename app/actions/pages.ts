"use server";

import { createServerClient } from "@/lib/supabase/server";
import { generateText, type JSONContent } from "@tiptap/core";
import { editorExtensions } from "@/lib/editor/extensions";

const WIPE_MIN_LENGTH = 200; // only guard documents with real content
const WIPE_SHRINK_RATIO = 0.1; // new text < 10% of old text = suspicious

export type SaveResult =
  | { status: "saved"; pageId: string }
  | {
      status: "needs_confirmation";
      reason: "looks_like_wipe";
      oldLength: number;
      newLength: number;
    };

// Save a page with the three recovery layers:
//   1. last-known-good (previous_content_json) + soft delete
//   2. wipe guard (block + confirm)
//   3. capped rolling snapshots (newest ~10)
export async function savePage(
  pageId: string,
  newContentJson: JSONContent,
  confirmWipe = false // second call passes true after the user confirms
): Promise<SaveResult> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Load current state
  const { data: page } = await supabase
    .from("pages")
    .select("content_json, content_text, owner_id")
    .eq("id", pageId)
    .single();
  if (!page) throw new Error("Page not found");
  if (page.owner_id !== user.id) throw new Error("Not allowed");

  // Derive plain text on the SERVER from the incoming JSON (never trust the client)
  const newText = generateText(newContentJson, editorExtensions);
  const oldText = page.content_text ?? "";

  // Layer 2: wipe guard — block & ask for confirmation
  const looksLikeWipe =
    oldText.length > WIPE_MIN_LENGTH &&
    newText.trim().length < oldText.length * WIPE_SHRINK_RATIO;
  if (looksLikeWipe && !confirmWipe) {
    return {
      status: "needs_confirmation",
      reason: "looks_like_wipe",
      oldLength: oldText.length,
      newLength: newText.trim().length,
    };
  }

  // Layer 3: only snapshot if content meaningfully changed
  const changed = newText !== oldText;
  if (changed) {
    await supabase.from("page_recovery_snapshots").insert({
      page_id: pageId,
      content_json: page.content_json, // snapshot the OLD state before we overwrite
      content_text: oldText,
      saved_by: user.id,
    });
    // Prune to newest 10
    const { data: keep } = await supabase
      .from("page_recovery_snapshots")
      .select("id")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .range(0, 9);
    if (keep) {
      const keepIds = keep.map((r) => r.id);
      await supabase
        .from("page_recovery_snapshots")
        .delete()
        .eq("page_id", pageId)
        .not("id", "in", `(${keepIds.join(",")})`);
    }
  }

  // Layer 1 + the actual write: keep the prior good copy alongside the new content
  await supabase
    .from("pages")
    .update({
      content_json: newContentJson,
      content_text: newText,
      previous_content_json: page.content_json, // last-known-good
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);

  return { status: "saved", pageId };
}

// Soft delete instead of removing the row
export async function deletePage(pageId: string) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  await supabase
    .from("pages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pageId)
    .eq("owner_id", user.id);
}

// One-step undo: restore the last-known-good copy
export async function restorePreviousContent(pageId: string) {
  const supabase = createServerClient();
  const { data: page } = await supabase
    .from("pages")
    .select("previous_content_json")
    .eq("id", pageId)
    .single();
  if (!page?.previous_content_json) throw new Error("Nothing to restore");
  const text = generateText(
    page.previous_content_json as JSONContent,
    editorExtensions
  );
  await supabase
    .from("pages")
    .update({ content_json: page.previous_content_json, content_text: text })
    .eq("id", pageId);
}
