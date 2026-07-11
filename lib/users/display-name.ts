import { createAdminClient } from "@/lib/supabase/server";

/** Resolve a display label for a user id (admin Auth API). */
export async function resolveUserDisplayName(
  userId: string | null | undefined
): Promise<string> {
  if (!userId) return "Unknown";
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return "Unknown";
  const user = data.user;
  return (
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Unknown"
  );
}

/** Batch-resolve display names for many user ids. */
export async function resolveUserDisplayNames(
  userIds: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const unique = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id)))
  );
  const entries = await Promise.all(
    unique.map(async (id) => [id, await resolveUserDisplayName(id)] as const)
  );
  return new Map(entries);
}
