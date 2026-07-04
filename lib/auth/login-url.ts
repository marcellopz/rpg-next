/** Build a /login URL that sends the user back to `returnPath` after sign-in. */
export function loginUrl(returnPath?: string | null): string {
  const safe = safeReturnPath(returnPath, "");
  if (!safe || safe === "/login" || safe.startsWith("/login?") || safe.startsWith("/auth")) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(safe)}`;
}

/** Relative in-app path only — blocks open redirects. */
export function safeReturnPath(
  path: string | null | undefined,
  fallback = "/campaigns"
): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return fallback;
}

/** Short-lived cookie so OAuth return path survives Supabase redirects. */
export const AUTH_RETURN_COOKIE = "auth_return_path";
export const AUTH_RETURN_MAX_AGE = 600;
