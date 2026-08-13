"use server";

// No revalidatePath here: the map tool owns its state client-side
// (useCampaignMap fetches via fetchMapForCampaignClient) and applies
// optimistic updates for pin mutations.
import type { ActionResult } from "@/app/actions/campaigns";
import { isCampaignMember } from "@/lib/campaign/permissions";
import {
  MAP_PIN_TYPES,
  mapPinRow,
  mapsFolder,
  type MapPin,
  type MapPinDbRow,
  type MapPinLogAction,
  type MapPinType,
} from "@/lib/map/types";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { resolveUserDisplayNames } from "@/lib/users/display-name";

async function assertMember(campaignId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not signed in.", user: null };
  const member = await isCampaignMember(user.id, campaignId);
  if (!member) return { ok: false as const, error: "Not allowed.", user: null };
  return { ok: true as const, error: null, user };
}

async function logPinChange(input: {
  mapId: string;
  actorId: string;
  action: MapPinLogAction;
  pinLabel: string;
}) {
  const summaries: Record<MapPinLogAction, string> = {
    add: `Added pin "${input.pinLabel}"`,
    edit: `Edited pin "${input.pinLabel}"`,
    move: `Moved pin "${input.pinLabel}"`,
    delete: `Deleted pin "${input.pinLabel}"`,
  };
  const admin = createAdminClient();
  // Best effort: a failed log write shouldn't undo the pin change itself.
  await admin.from("map_pin_log_entries").insert({
    map_id: input.mapId,
    actor_id: input.actorId,
    action: input.action,
    pin_label: input.pinLabel,
    description: summaries[input.action],
  });
}

/**
 * Point the campaign's map at a freshly uploaded image (creating the map row
 * on first upload). The previous image object is deleted best-effort.
 */
export async function registerCampaignMap(input: {
  campaignId: string;
  path: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertMember(input.campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const prefix = `${mapsFolder(input.campaignId)}/`;
  if (!input.path.startsWith(prefix)) {
    return { ok: false, error: "Invalid file path." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("campaign_maps")
    .select("id, image_path")
    .eq("campaign_id", input.campaignId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("campaign_maps")
      .update({
        image_path: input.path,
        uploaded_by: auth.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };

    if (existing.image_path && existing.image_path !== input.path) {
      // Best effort — an orphaned object is not worth failing the replace.
      await admin.storage.from("public-assets").remove([existing.image_path]);
    }
    return { ok: true, data: { id: existing.id } };
  }

  const { data, error } = await admin
    .from("campaign_maps")
    .insert({
      campaign_id: input.campaignId,
      image_path: input.path,
      uploaded_by: auth.user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: { id: data.id } };
}

async function getMapCampaignId(mapId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaign_maps")
    .select("campaign_id")
    .eq("id", mapId)
    .maybeSingle();
  return data?.campaign_id ?? null;
}

function validCoordinate(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export async function addMapPin(input: {
  mapId: string;
  x: number;
  y: number;
  label: string;
  description?: string;
  type: MapPinType;
}): Promise<ActionResult<{ pin: MapPin }>> {
  const label = input.label.trim();
  if (!label) return { ok: false, error: "Label is required." };
  if (!validCoordinate(input.x) || !validCoordinate(input.y)) {
    return { ok: false, error: "Pin position is out of bounds." };
  }
  if (!MAP_PIN_TYPES.includes(input.type)) {
    return { ok: false, error: "Unknown pin type." };
  }

  const campaignId = await getMapCampaignId(input.mapId);
  if (!campaignId) return { ok: false, error: "Map not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("map_pins")
    .insert({
      map_id: input.mapId,
      x: input.x,
      y: input.y,
      label,
      description: input.description?.trim() || null,
      type: input.type,
      created_by: auth.user.id,
    })
    .select("id, map_id, x, y, label, description, type, created_by, created_at")
    .single();
  if (error) return { ok: false, error: error.message };

  await logPinChange({
    mapId: input.mapId,
    actorId: auth.user.id,
    action: "add",
    pinLabel: label,
  });

  return { ok: true, data: { pin: mapPinRow(data as MapPinDbRow) } };
}

export async function updateMapPin(input: {
  pinId: string;
  x?: number;
  y?: number;
  label?: string;
  description?: string | null;
  type?: MapPinType;
}): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data: pin } = await admin
    .from("map_pins")
    .select("id, map_id, label")
    .eq("id", input.pinId)
    .maybeSingle();
  if (!pin) return { ok: false, error: "Pin not found." };

  const campaignId = await getMapCampaignId(pin.map_id);
  if (!campaignId) return { ok: false, error: "Map not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  const movesPin = input.x !== undefined || input.y !== undefined;
  const editsContent =
    input.label !== undefined ||
    input.description !== undefined ||
    input.type !== undefined;

  if (input.x !== undefined) {
    if (!validCoordinate(input.x)) {
      return { ok: false, error: "Pin position is out of bounds." };
    }
    patch.x = input.x;
  }
  if (input.y !== undefined) {
    if (!validCoordinate(input.y)) {
      return { ok: false, error: "Pin position is out of bounds." };
    }
    patch.y = input.y;
  }
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) return { ok: false, error: "Label is required." };
    patch.label = label;
  }
  if (input.description !== undefined) {
    patch.description = input.description?.trim() || null;
  }
  if (input.type !== undefined) {
    if (!MAP_PIN_TYPES.includes(input.type)) {
      return { ok: false, error: "Unknown pin type." };
    }
    patch.type = input.type;
  }
  if (!movesPin && !editsContent) return { ok: true, data: undefined };

  const { error } = await admin
    .from("map_pins")
    .update(patch)
    .eq("id", input.pinId);
  if (error) return { ok: false, error: error.message };

  await logPinChange({
    mapId: pin.map_id,
    actorId: auth.user.id,
    // A combined move+edit logs as the more descriptive of the two.
    action: editsContent ? "edit" : "move",
    pinLabel: (patch.label as string | undefined) ?? pin.label,
  });

  return { ok: true, data: undefined };
}

export async function deleteMapPin(input: {
  pinId: string;
}): Promise<ActionResult> {
  const admin = createAdminClient();
  const { data: pin } = await admin
    .from("map_pins")
    .select("id, map_id, label")
    .eq("id", input.pinId)
    .maybeSingle();
  if (!pin) return { ok: false, error: "Pin not found." };

  const campaignId = await getMapCampaignId(pin.map_id);
  if (!campaignId) return { ok: false, error: "Map not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const { error } = await admin.from("map_pins").delete().eq("id", input.pinId);
  if (error) return { ok: false, error: error.message };

  await logPinChange({
    mapId: pin.map_id,
    actorId: auth.user.id,
    action: "delete",
    pinLabel: pin.label,
  });

  return { ok: true, data: undefined };
}

export type MapPinLogEntry = {
  id: string;
  action: MapPinLogAction;
  pinLabel: string;
  actorName: string;
  createdAt: string;
};

/** Newest-first pin change history for the map's History panel. */
export async function listMapPinLog(
  mapId: string
): Promise<ActionResult<MapPinLogEntry[]>> {
  const campaignId = await getMapCampaignId(mapId);
  if (!campaignId) return { ok: false, error: "Map not found." };
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("map_pin_log_entries")
    .select("id, actor_id, action, pin_label, created_at")
    .eq("map_id", mapId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { ok: false, error: error.message };

  const rows = data ?? [];
  const names = await resolveUserDisplayNames(rows.map((row) => row.actor_id));

  return {
    ok: true,
    data: rows.map((row) => ({
      id: row.id,
      action: row.action as MapPinLogAction,
      pinLabel: row.pin_label,
      actorName: names.get(row.actor_id) ?? "Unknown",
      createdAt: row.created_at,
    })),
  };
}
