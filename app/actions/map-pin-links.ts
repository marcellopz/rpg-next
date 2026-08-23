"use server";

// No revalidatePath here: both the map and note editor own this state
// client-side, refetching after each mutation (same reasoning as
// app/actions/maps.ts and app/actions/files.ts).
import type { ActionResult } from "@/app/actions/campaigns";
import {
  DEMO_MAP_PINS,
  getDemoPagesLinkedToPin,
  getDemoPinsLinkedToPage,
  isDemoCampaignId,
  isDemoPageId,
  isDemoPinId,
} from "@/data/demo-campaign";
import { DEMO_PAGES } from "@/data/demo-campaign/notes";
import { isCampaignMember } from "@/lib/campaign/permissions";
import type { LinkedNote, LinkedPin, MapPinType } from "@/lib/map/types";
import { parseMapPinType } from "@/lib/map/types";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";

async function assertMember(campaignId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not signed in.", user: null };
  const member = await isCampaignMember(user.id, campaignId);
  if (!member) return { ok: false as const, error: "Not allowed.", user: null };
  return { ok: true as const, error: null, user };
}

async function getPinCampaignId(pinId: string): Promise<string | null> {
  if (isDemoPinId(pinId)) return "demo";

  const admin = createAdminClient();
  const { data } = await admin
    .from("map_pins")
    .select("map_id, campaign_maps!inner(campaign_id)")
    .eq("id", pinId)
    .maybeSingle();
  const joined = data?.campaign_maps as unknown as
    | { campaign_id: string }
    | { campaign_id: string }[]
    | null;
  if (!joined) return null;
  return Array.isArray(joined) ? joined[0]?.campaign_id ?? null : joined.campaign_id;
}

/** A page this user is allowed to link to: the same rule as pages' own RLS. */
async function assertPageVisible(pageId: string, userId: string) {
  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages")
    .select("id, campaign_id, visibility, owner_id, deleted_at")
    .eq("id", pageId)
    .maybeSingle();
  if (!page || page.deleted_at) return { ok: false as const, page: null };
  if (page.visibility === "private" && page.owner_id !== userId) {
    return { ok: false as const, page: null };
  }
  return { ok: true as const, page };
}

export async function linkPinToPage(input: {
  pinId: string;
  pageId: string;
}): Promise<ActionResult> {
  if (isDemoPinId(input.pinId) || isDemoPageId(input.pageId)) {
    return { ok: false, error: "Demo campaign is read-only." };
  }
  const campaignId = await getPinCampaignId(input.pinId);
  if (!campaignId) return { ok: false, error: "Pin not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const pageCheck = await assertPageVisible(input.pageId, auth.user.id);
  if (!pageCheck.ok || !pageCheck.page) {
    return { ok: false, error: "Note not found." };
  }
  if (pageCheck.page.campaign_id !== campaignId) {
    return { ok: false, error: "That note belongs to a different campaign." };
  }

  const admin = createAdminClient();
  // ignoreDuplicates -> ON CONFLICT DO NOTHING: there's nothing to update on
  // a re-link, and DO NOTHING needs only INSERT privilege (DO UPDATE would
  // additionally require UPDATE, which service_role isn't granted here).
  const { error } = await admin
    .from("map_pin_pages")
    .upsert(
      { pin_id: input.pinId, page_id: input.pageId, created_by: auth.user.id },
      { onConflict: "pin_id,page_id", ignoreDuplicates: true }
    );
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

export async function unlinkPinFromPage(input: {
  pinId: string;
  pageId: string;
}): Promise<ActionResult> {
  if (isDemoPinId(input.pinId) || isDemoPageId(input.pageId)) {
    return { ok: false, error: "Demo campaign is read-only." };
  }
  const campaignId = await getPinCampaignId(input.pinId);
  if (!campaignId) return { ok: false, error: "Pin not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("map_pin_pages")
    .delete()
    .eq("pin_id", input.pinId)
    .eq("page_id", input.pageId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: undefined };
}

/** Notes linked to a pin, visible to the current user — for the pin popover. */
export async function listPagesLinkedToPin(
  pinId: string
): Promise<ActionResult<LinkedNote[]>> {
  if (isDemoPinId(pinId)) {
    return { ok: true, data: getDemoPagesLinkedToPin(pinId) };
  }

  const campaignId = await getPinCampaignId(pinId);
  if (!campaignId) return { ok: false, error: "Pin not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("map_pin_pages")
    .select("page:pages!inner(id, title, visibility, owner_id, deleted_at)")
    .eq("pin_id", pinId);
  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as unknown as {
    page: {
      id: string;
      title: string;
      visibility: "public" | "private";
      owner_id: string;
      deleted_at: string | null;
    };
  }[];

  return {
    ok: true,
    data: rows
      .map((row) => row.page)
      .filter(
        (page) =>
          !page.deleted_at &&
          (page.visibility === "public" || page.owner_id === auth.user!.id)
      )
      .map((page) => ({
        pageId: page.id,
        title: page.title,
        visibility: page.visibility,
      })),
  };
}

/** Pins linked to a note page — for the "linked map pins" section on the page. */
export async function listPinsLinkedToPage(
  pageId: string
): Promise<ActionResult<LinkedPin[]>> {
  if (isDemoPageId(pageId)) {
    return { ok: true, data: getDemoPinsLinkedToPage(pageId) };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const pageCheck = await assertPageVisible(pageId, user.id);
  if (!pageCheck.ok || !pageCheck.page) return { ok: false, error: "Note not found." };
  const auth = await assertMember(pageCheck.page.campaign_id);
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("map_pin_pages")
    .select("pin:map_pins!inner(id, label, type)")
    .eq("page_id", pageId);
  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as unknown as {
    pin: { id: string; label: string; type: string };
  }[];

  return {
    ok: true,
    data: rows.map((row) => ({
      pinId: row.pin.id,
      label: row.pin.label,
      type: parseMapPinType(row.pin.type),
    })),
  };
}

export type MapPinOption = { id: string; label: string; type: MapPinType };

/** All pins on the campaign's map — options for the note editor's picker. */
export async function listMapPinOptions(
  campaignId: string
): Promise<ActionResult<MapPinOption[]>> {
  if (isDemoCampaignId(campaignId)) {
    return {
      ok: true,
      data: DEMO_MAP_PINS.map((p) => ({
        id: p.id,
        label: p.label,
        type: p.type,
      })),
    };
  }

  const auth = await assertMember(campaignId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data: map } = await admin
    .from("campaign_maps")
    .select("id")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!map) return { ok: true, data: [] };

  const { data, error } = await admin
    .from("map_pins")
    .select("id, label, type")
    .eq("map_id", map.id)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      type: parseMapPinType(row.type),
    })),
  };
}

export type NotePageOption = {
  id: string;
  title: string;
  visibility: "public" | "private";
};

/** Notes visible to the current user in this campaign — options for the pin picker. */
export async function listNotePageOptions(
  campaignId: string
): Promise<ActionResult<NotePageOption[]>> {
  if (isDemoCampaignId(campaignId)) {
    return {
      ok: true,
      data: Object.values(DEMO_PAGES).map((page) => ({
        id: page.id,
        title: page.title,
        visibility: page.visibility,
      })),
    };
  }

  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pages")
    .select("id, title, visibility, owner_id")
    .eq("campaign_id", campaignId)
    .is("deleted_at", null)
    .or(`visibility.eq.public,owner_id.eq.${auth.user.id}`)
    .order("title", { ascending: true });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      visibility: row.visibility as "public" | "private",
    })),
  };
}
