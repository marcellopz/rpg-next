// Server-side Supabase client for use in Server Components and Server Actions.
//
// Two factories:
//  - createServerClient(): user-scoped, reads the auth cookie so auth.getUser()
//    works and RLS applies as the signed-in user. Use for most server actions.
//  - createAdminClient(): service-role key, bypasses RLS. Use ONLY for trusted
//    multi-step logic that must write rows a user can't write directly
//    (e.g. memberships, invites).
import { cookies } from "next/headers";
import {
  createServerClient as createSSRClient,
  type CookieOptions,
} from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  const cookieStore = cookies();
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component where cookies are read-only — ignore.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore
          }
        },
      },
    }
  );
}

// Trusted client (service role). Never import this into client components.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
