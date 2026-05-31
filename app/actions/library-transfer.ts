"use server";

import { createServerClient } from "@/lib/supabase/server";

// Both directions follow one rule: read the source, write a new owned copy in
// the destination, record provenance, never mutate the source.

// PERSONAL -> CAMPAIGN : copy a library item into a campaign as campaign content.
export async function copyItemToCampaign(itemId: string, campaignId: string) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Must own the item AND be a member of the destination campaign
  const { data: item } = await supabase
    .from("library_items")
    .select("*")
    .eq("id", itemId)
    .eq("owner_id", user.id)
    .single();
  if (!item) throw new Error("Item not found");

  const { data: member } = await supabase
    .from("memberships")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", user.id)
    .single();
  if (!member) throw new Error("Not a member of that campaign");

  // Dispatch by kind: read the body, write the matching campaign row.
  if (item.kind === "character") {
    const { data: body } = await supabase
      .from("library_character_bodies")
      .select("*")
      .eq("item_id", itemId)
      .single();
    await supabase.from("characters").insert({
      campaign_id: campaignId,
      owner_id: user.id,
      name: body!.name,
      sheet: body!.sheet,
    });
  } else if (item.kind === "note" || item.kind === "idea") {
    const { data: body } = await supabase
      .from("library_note_bodies")
      .select("*")
      .eq("item_id", itemId)
      .single();
    await supabase.from("pages").insert({
      campaign_id: campaignId,
      title: item.title,
      content_json: body!.content_json,
      content_text: body!.content_text,
      owner_id: user.id,
      visibility: "private",
    });
  }
  // ...other kinds (image -> copy storage object, spell -> a page, etc.)
}

// CAMPAIGN -> PERSONAL : import campaign content as a library item the user owns.
export async function importPageToLibrary(pageId: string, folderId?: string) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Must be able to see the source page (RLS enforces membership + visibility)
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .single();
  if (!page) throw new Error("Page not found or not visible");

  // 1. Create the envelope, stamping provenance
  const { data: env } = await supabase
    .from("library_items")
    .insert({
      owner_id: user.id,
      kind: "note",
      title: page.title,
      folder_id: folderId ?? null,
      source_kind: "campaign_page",
      source_id: page.id,
    })
    .select()
    .single();

  // 2. Create the typed body
  await supabase.from("library_note_bodies").insert({
    item_id: env!.id,
    content_json: page.content_json,
    content_text: page.content_text,
  });

  return env!.id as string;
}
