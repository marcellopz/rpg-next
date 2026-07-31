import type { UserAppMetadata, UserMetadata } from "@supabase/supabase-js";

// The identity fields this app actually consumes, named to match the JWT claim
// shape so `user.user_metadata?.display_name` reads the same as it did when
// getCurrentUser() returned a full Supabase `User`.
//
// Lives here rather than in server.ts so client components can import the type
// without pulling in a module that depends on next/headers.
export type SessionUser = {
  id: string;
  email: string | null;
  user_metadata: UserMetadata;
  app_metadata: UserAppMetadata;
};
