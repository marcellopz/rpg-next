"use server";

import { createServerClient } from "@/lib/supabase/server";

// Viewing a private file: confirm membership, then hand back a short-lived
// signed URL rather than a public link.
export async function getPrivateFileUrl(fileId: string) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: file } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single();
  if (!file) throw new Error("Not found");

  // Confirm membership before handing out a link
  const { data: me } = await supabase
    .from("memberships")
    .select("id")
    .eq("campaign_id", file.campaign_id)
    .eq("user_id", user.id)
    .single();
  if (!me) throw new Error("Not allowed");

  // Signed URL valid for 60 seconds
  const { data } = await supabase.storage
    .from("private-files")
    .createSignedUrl(file.path, 60);
  return data?.signedUrl;
}
