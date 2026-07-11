"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/campaigns";
import { isCampaignMember, isCampaignOwner } from "@/lib/campaign/permissions";
import { mapFileRow, type FileDbRow } from "@/lib/files/mappers";
import {
  bucketForVisibility,
  handoutsFolder,
  type HandoutBroadcast,
  type HandoutVisibility,
  type StorageBucket,
} from "@/lib/files/types";
import {
  createAdminClient,
  createServerClient,
  getCurrentUser,
} from "@/lib/supabase/server";
import { resolveUserDisplayNames } from "@/lib/users/display-name";

async function revalidateCampaignWorkspace(campaignId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaigns")
    .select("public_code")
    .eq("id", campaignId)
    .maybeSingle();
  if (data?.public_code) {
    revalidatePath(`/campaigns/${data.public_code}`);
  }
}

async function assertMember(campaignId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Not signed in.", user: null };
  const member = await isCampaignMember(user.id, campaignId);
  if (!member) return { ok: false as const, error: "Not allowed.", user: null };
  return { ok: true as const, error: null, user };
}

function adminPublicUrl(bucket: StorageBucket, path: string): string | null {
  if (bucket !== "public-assets") return null;
  const admin = createAdminClient();
  return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function toBroadcast(
  campaignId: string,
  fileId: string | null,
  shownBy: string | null,
  updatedAt: string,
  fileRow: FileDbRow | null
): HandoutBroadcast {
  return {
    campaignId,
    fileId,
    shownBy,
    updatedAt,
    file: fileRow ? mapFileRow(fileRow, adminPublicUrl) : null,
  };
}

export async function registerCampaignFile(input: {
  campaignId: string;
  path: string;
  filename: string;
  contentType: string | null;
  sizeBytes: number;
  visibility: HandoutVisibility;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await assertMember(input.campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const bucket = bucketForVisibility(input.visibility);
  const prefix = `${handoutsFolder(input.campaignId)}/`;
  if (!input.path.startsWith(prefix)) {
    return { ok: false, error: "Invalid file path." };
  }
  if (input.visibility === "public" && bucket !== "public-assets") {
    return { ok: false, error: "Public files must use the public bucket." };
  }
  if (input.visibility === "private" && bucket !== "private-files") {
    return { ok: false, error: "Personal files must use the private bucket." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("files")
    .insert({
      campaign_id: input.campaignId,
      uploader_id: auth.user.id,
      bucket,
      path: input.path,
      filename: input.filename.trim() || "file",
      content_type: input.contentType,
      size_bytes: input.sizeBytes,
      visibility: input.visibility,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: { id: data.id } };
}

/**
 * Delete a handout: storage object + metadata row.
 * Personal files: uploader only. Shared files: uploader or campaign owner.
 */
export async function deleteCampaignFile(input: {
  campaignId: string;
  fileId: string;
}): Promise<ActionResult> {
  const auth = await assertMember(input.campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("files")
    .select(
      "id, campaign_id, uploader_id, bucket, path, visibility"
    )
    .eq("id", input.fileId)
    .maybeSingle();

  if (!file || file.campaign_id !== input.campaignId) {
    return { ok: false, error: "File not found." };
  }

  const isUploader = file.uploader_id === auth.user.id;
  const isOwner = await isCampaignOwner(auth.user.id, input.campaignId);
  const canDeleteShared = file.visibility === "public" && isOwner;
  if (!isUploader && !canDeleteShared) {
    return { ok: false, error: "Not allowed to delete this file." };
  }

  const { error: storageError } = await admin.storage
    .from(file.bucket as StorageBucket)
    .remove([file.path]);
  if (storageError) {
    return { ok: false, error: storageError.message };
  }

  // Clear active table broadcast if this file is currently shown.
  const { data: broadcast } = await admin
    .from("campaign_handout_broadcasts")
    .select("file_id")
    .eq("campaign_id", input.campaignId)
    .maybeSingle();
  if (broadcast?.file_id === input.fileId) {
    await admin.from("campaign_handout_broadcasts").upsert(
      {
        campaign_id: input.campaignId,
        file_id: null,
        shown_by: auth.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "campaign_id" }
    );
  }

  const { error } = await admin.from("files").delete().eq("id", input.fileId);
  if (error) return { ok: false, error: error.message };

  await revalidateCampaignWorkspace(input.campaignId);
  return { ok: true, data: undefined };
}

/**
 * Signed URL for a personal (private) file — uploader only.
 */
export async function getPrivateHandoutUrl(input: {
  campaignId: string;
  path: string;
}): Promise<ActionResult<{ url: string }>> {
  const auth = await assertMember(input.campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const prefix = `${handoutsFolder(input.campaignId)}/`;
  if (!input.path.startsWith(prefix)) {
    return { ok: false, error: "Invalid file path." };
  }

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("files")
    .select("id, uploader_id, visibility, bucket")
    .eq("campaign_id", input.campaignId)
    .eq("path", input.path)
    .maybeSingle();

  if (!file) return { ok: false, error: "File not found." };
  if (file.visibility !== "private" || file.bucket !== "private-files") {
    return { ok: false, error: "Not a personal file." };
  }
  if (file.uploader_id !== auth.user.id) {
    return { ok: false, error: "Not allowed." };
  }

  const { data, error } = await admin.storage
    .from("private-files")
    .createSignedUrl(input.path, 120);

  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "Could not create signed URL." };
  }

  return { ok: true, data: { url: data.signedUrl } };
}

/** Show a shared (public) handout to everyone in the campaign. */
export async function showHandoutToTable(input: {
  campaignId: string;
  fileId: string;
}): Promise<ActionResult<HandoutBroadcast>> {
  const auth = await assertMember(input.campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const admin = createAdminClient();
  const { data: file } = await admin
    .from("files")
    .select(
      "id, campaign_id, uploader_id, bucket, path, filename, content_type, size_bytes, visibility, created_at"
    )
    .eq("id", input.fileId)
    .maybeSingle();

  if (!file || file.campaign_id !== input.campaignId) {
    return { ok: false, error: "File not found." };
  }
  if (file.visibility !== "public" || file.bucket !== "public-assets") {
    return {
      ok: false,
      error: "Only shared (public) files can be shown to the table.",
    };
  }

  const updatedAt = new Date().toISOString();
  const { error } = await admin.from("campaign_handout_broadcasts").upsert(
    {
      campaign_id: input.campaignId,
      file_id: input.fileId,
      shown_by: auth.user.id,
      updated_at: updatedAt,
    },
    { onConflict: "campaign_id" }
  );

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(input.campaignId);

  return {
    ok: true,
    data: toBroadcast(
      input.campaignId,
      input.fileId,
      auth.user.id,
      updatedAt,
      file as FileDbRow
    ),
  };
}

/** Clear the shared handout popup for everyone. */
export async function clearHandoutBroadcast(
  campaignId: string
): Promise<ActionResult<HandoutBroadcast>> {
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const updatedAt = new Date().toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("campaign_handout_broadcasts").upsert(
    {
      campaign_id: campaignId,
      file_id: null,
      shown_by: auth.user.id,
      updated_at: updatedAt,
    },
    { onConflict: "campaign_id" }
  );

  if (error) return { ok: false, error: error.message };
  await revalidateCampaignWorkspace(campaignId);

  return {
    ok: true,
    data: toBroadcast(campaignId, null, auth.user.id, updatedAt, null),
  };
}

export type HandoutHistoryEntry = {
  id: string;
  filename: string;
  visibility: HandoutVisibility;
  uploaderName: string;
  createdAt: string;
  contentType: string | null;
  sizeBytes: number | null;
};

/** Campaign handout upload history visible to the current user (RLS applies). */
export async function listHandoutHistory(
  campaignId: string
): Promise<ActionResult<HandoutHistoryEntry[]>> {
  const auth = await assertMember(campaignId);
  if (!auth.ok || !auth.user) return { ok: false, error: auth.error };

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("files")
    .select(
      "id, campaign_id, uploader_id, bucket, path, filename, content_type, size_bytes, visibility, created_at"
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as FileDbRow[];
  const names = await resolveUserDisplayNames(rows.map((row) => row.uploader_id));

  return {
    ok: true,
    data: rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      visibility: row.visibility,
      uploaderName: names.get(row.uploader_id) ?? "Unknown",
      createdAt: row.created_at,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
    })),
  };
}

export type { StorageBucket };
